use serde_json::{Value, Map};
use crate::lexer::{Lexer, Token, TokenType, TokenValue};

pub struct LeanParser {
    strict: bool,
    tokens: Vec<Token>,
    pos: usize,
}

impl LeanParser {
    pub fn new(strict: bool) -> Self {
        Self {
            strict,
            tokens: Vec::new(),
            pos: 0,
        }
    }

    pub fn parse(&mut self, input: &str) -> Result<Value, String> {
        let mut lexer = Lexer::new(input);
        self.tokens = lexer.tokenize()?;
        self.pos = 0;

        let result = self.parse_block()?;

        if self.peek().token_type != TokenType::Eof {
            return Err(format!("Unexpected token after end of document: {:?}", self.peek().token_type));
        }

        Ok(result)
    }

    fn parse_block(&mut self) -> Result<Value, String> {
        let mut obj = Map::new();

        while self.peek().token_type != TokenType::Eof && self.peek().token_type != TokenType::Dedent {
            if self.peek().token_type == TokenType::Indent {
                return Err(format!("Unexpected indentation at document root (or inside block) at line {}", self.peek().line));
            }
            if self.peek().token_type == TokenType::Newline {
                self.advance();
                continue;
            }

            if let Some((key, val)) = self.parse_item()? {
                // Merge deeply
                Self::deep_merge(&mut obj, key, val);
            }
        }

        Ok(Value::Object(obj))
    }

    fn deep_merge(target: &mut Map<String, Value>, key: String, source: Value) {
        if let Some(target_val) = target.get_mut(&key) {
            if target_val.is_object() && source.is_object() {
                let target_obj = target_val.as_object_mut().unwrap();
                let source_obj = source.as_object().unwrap();
                for (k, v) in source_obj {
                    Self::deep_merge(target_obj, k.clone(), v.clone());
                }
            } else {
                target.insert(key, source);
            }
        } else {
            target.insert(key, source);
        }
    }

    fn parse_item(&mut self) -> Result<Option<(String, Value)>, String> {
        let key_token = self.peek().clone();

        if key_token.token_type == TokenType::Hyphen {
            return Err(format!("Unexpected list item at line {}. Expected key.", key_token.line));
        }

        if key_token.token_type != TokenType::Identifier && key_token.token_type != TokenType::String {
            return Err(format!("Expected key-value pair or row syntax (identifier) at line {}, found {:?}", key_token.line, key_token.token_type));
        }

        let key = match key_token.value {
            TokenValue::String(ref s) => s.clone(),
            _ => return Err(format!("Expected string key at line {}", key_token.line)),
        };
        self.advance();

        if self.peek().token_type == TokenType::LParen {
            return self.parse_row_list(key).map(Some);
        }

        if self.peek().token_type != TokenType::Colon {
            return Err(format!("Expected ':' after key at line {}", key_token.line));
        }
        self.advance(); // Skip colon

        let value = self.parse_value()?;

        if key.contains('.') {
            let (root_key, expanded) = Self::expand_dot_notation(&key, value);
            Ok(Some((root_key, expanded)))
        } else {
            Ok(Some((key, value)))
        }
    }

    fn parse_row_list(&mut self, key: String) -> Result<(String, Value), String> {
        self.consume(TokenType::LParen)?;
        let mut columns = Vec::new();

        while self.peek().token_type != TokenType::RParen {
            let col_token = self.consume(TokenType::Identifier)?;
            if let TokenValue::String(s) = col_token.value {
                columns.push(s);
            }
            if self.peek().token_type == TokenType::Comma {
                self.advance();
            }
        }
        self.consume(TokenType::RParen)?;
        self.consume(TokenType::Colon)?;

        if self.peek().token_type == TokenType::Newline {
            self.advance();
        } else if self.peek().token_type == TokenType::Eof {
            // allow EOF
        } else {
            return Err(format!("Expected NEWLINE or EOF after colon at line {}", self.peek().line));
        }

        if self.peek().token_type == TokenType::Indent {
            self.consume(TokenType::Indent)?;
        } else {
            if self.peek().token_type == TokenType::Eof {
                return Ok((key, Value::Array(vec![])));
            }
            return Ok((key, Value::Array(vec![])));
        }

        let mut rows = Vec::new();
        while self.peek().token_type == TokenType::Hyphen {
            self.advance(); // skip hyphen
            let mut row = Map::new();
            let mut values = Vec::new();

            while self.peek().token_type != TokenType::Newline && self.peek().token_type != TokenType::Eof {
                values.push(self.parse_simple_value()?);
                if self.peek().token_type == TokenType::Comma {
                    self.advance();
                } else {
                    break;
                }
            }

            if self.strict && values.len() > columns.len() {
                return Err(format!("Row has {} values but header defines {} columns at line {}", values.len(), columns.len(), self.peek().line));
            }

            for (idx, col) in columns.iter().enumerate() {
                row.insert(col.clone(), if idx < values.len() { values[idx].clone() } else { Value::Null });
            }
            rows.push(Value::Object(row));

            if self.peek().token_type == TokenType::Newline {
                self.advance();
            }
        }

        self.consume(TokenType::Dedent)?;

        if key.contains('.') {
            let (root_key, expanded) = Self::expand_dot_notation(&key, Value::Array(rows));
            Ok((root_key, expanded))
        } else {
            Ok((key, Value::Array(rows)))
        }
    }

    fn parse_value(&mut self) -> Result<Value, String> {
        if self.peek().token_type == TokenType::Newline {
            self.advance();
            if self.peek().token_type == TokenType::Indent {
                self.advance();

                if self.peek().token_type == TokenType::Hyphen {
                    let list = self.parse_list()?;
                    self.consume(TokenType::Dedent)?;
                    return Ok(list);
                } else {
                    let obj = self.parse_block()?;
                    self.consume(TokenType::Dedent)?;
                    return Ok(obj);
                }
            } else {
                return Ok(Value::Null); // Empty value
            }
        }

        if self.peek().token_type == TokenType::Eof || self.peek().token_type == TokenType::Dedent {
            return Ok(Value::Null);
        }

        self.parse_simple_value()
    }

    fn parse_list(&mut self) -> Result<Value, String> {
        let mut list = Vec::new();

        while self.peek().token_type == TokenType::Hyphen {
            self.advance();

            if self.peek().token_type == TokenType::Newline {
                self.advance();
                self.consume(TokenType::Indent)?;
                if self.peek().token_type == TokenType::Hyphen {
                    list.push(self.parse_list()?);
                } else {
                    list.push(self.parse_block()?);
                }
                self.consume(TokenType::Dedent)?;
            } else {
                let is_object = self.peek().token_type == TokenType::Identifier || self.peek().token_type == TokenType::String;
                let next_peek = if self.pos + 1 < self.tokens.len() { Some(&self.tokens[self.pos + 1]) } else { None };

                if is_object && next_peek.map_or(false, |t| t.token_type == TokenType::Colon) {
                    let mut item_obj = Map::new();
                    
                    if let Some((k, v)) = self.parse_item()? {
                        Self::deep_merge(&mut item_obj, k, v);
                    }

                    if self.peek().token_type == TokenType::Newline {
                        self.advance();
                    }

                    if self.peek().token_type == TokenType::Indent {
                        self.advance();
                        let rest_block = self.parse_block()?;
                        if let Value::Object(rest_map) = rest_block {
                            for (k, v) in rest_map {
                                Self::deep_merge(&mut item_obj, k, v);
                            }
                        }
                        self.consume(TokenType::Dedent)?;
                    }
                    list.push(Value::Object(item_obj));
                } else {
                    list.push(self.parse_simple_value()?);
                    if self.peek().token_type == TokenType::Newline {
                        self.advance();
                    }
                }
            }
        }

        Ok(Value::Array(list))
    }

    fn parse_simple_value(&mut self) -> Result<Value, String> {
        let token = self.peek().clone();
        self.advance();

        match &token.token_type {
            TokenType::String | TokenType::Identifier => {
                if let TokenValue::String(ref s) = token.value {
                    Ok(Value::String(s.clone()))
                } else {
                    Err(format!("Expected string value at line {}", token.line))
                }
            }
            TokenType::Number => {
                if let TokenValue::Number(n) = token.value {
                    if let Some(num) = serde_json::Number::from_f64(n) {
                        Ok(Value::Number(num))
                    } else {
                        Ok(Value::Number(serde_json::Number::from(n as i64)))
                    }
                } else {
                    Err(format!("Expected number value at line {}", token.line))
                }
            }
            TokenType::Boolean => {
                if let TokenValue::Boolean(b) = token.value {
                    Ok(Value::Bool(b))
                } else {
                    Err(format!("Expected boolean value at line {}", token.line))
                }
            }
            TokenType::Null => Ok(Value::Null),
            TokenType::LBrace => {
                if self.peek().token_type == TokenType::RBrace {
                    self.advance();
                    Ok(Value::Object(Map::new()))
                } else {
                    Err(format!("Expected '}}' for empty object at line {}", token.line))
                }
            }
            TokenType::LBracket => {
                if self.peek().token_type == TokenType::RBracket {
                    self.advance();
                    Ok(Value::Array(vec![]))
                } else {
                    Err(format!("Expected ']' for empty list at line {}", token.line))
                }
            }
            _ => Err(format!("Unexpected token for value: {:?} at line {}", token.token_type, token.line)),
        }
    }

    fn expand_dot_notation(key: &str, value: Value) -> (String, Value) {
        let keys: Vec<&str> = key.split('.').collect();
        let mut result = value;

        for &k in keys.iter().skip(1).rev() {
            let mut map = Map::new();
            map.insert(k.to_string(), result);
            result = Value::Object(map);
        }

        (keys[0].to_string(), result)
    }

    fn peek(&self) -> &Token {
        &self.tokens[self.pos]
    }

    fn advance(&mut self) {
        if self.pos < self.tokens.len() - 1 {
            self.pos += 1;
        }
    }

    fn consume(&mut self, expected: TokenType) -> Result<Token, String> {
        let token = self.peek().clone();
        if token.token_type == expected {
            self.advance();
            Ok(token)
        } else {
            Err(format!("Expected {:?} but found {:?} at line {}", expected, token.token_type, token.line))
        }
    }
}
