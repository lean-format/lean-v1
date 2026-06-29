

#[derive(Debug, Clone, PartialEq)]
pub enum TokenType {
    Indent,
    Dedent,
    Newline,
    Identifier,
    String,
    Number,
    Boolean,
    Null,
    Colon,
    Hyphen,
    Comma,
    LParen,
    RParen,
    LBrace,
    RBrace,
    LBracket,
    RBracket,
    Eof,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TokenValue {
    String(String),
    Number(f64),
    Boolean(bool),
    Null,
    None,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub token_type: TokenType,
    pub value: TokenValue,
    pub line: usize,
    pub column: usize,
}

pub struct Lexer {
    input: Vec<char>,
    pos: usize,
    pub line: usize,
    pub column: usize,
    indent_stack: Vec<usize>,
    pub tokens: Vec<Token>,
    indentation_handled: bool,
    is_start_of_line: bool,
    indent_char: Option<char>,
}

impl Lexer {
    pub fn new(input: &str) -> Self {
        // Replace \r\n and \r with \n
        let normalized = input.replace("\r\n", "\n").replace('\r', "\n");
        Self {
            input: normalized.chars().collect(),
            pos: 0,
            line: 1,
            column: 1,
            indent_stack: vec![0],
            tokens: Vec::new(),
            indentation_handled: false,
            is_start_of_line: true,
            indent_char: None,
        }
    }

    pub fn tokenize(&mut self) -> Result<Vec<Token>, String> {
        while self.pos < self.input.len() {
            let ch = self.peek().unwrap();

            if ch == '\n' {
                self.add_token(TokenType::Newline, TokenValue::String("\n".to_string()));
                self.advance();
                self.line += 1;
                self.column = 1;
                self.indentation_handled = false;
                self.is_start_of_line = true;
                continue;
            }

            if self.column == 1 && !self.indentation_handled {
                self.handle_indentation()?;
                self.indentation_handled = true;
                if self.pos >= self.input.len() {
                    break;
                }
                continue;
            }

            if ch == ' ' || ch == '\t' {
                self.advance();
                continue;
            }

            if ch == '#' {
                self.skip_comment();
                continue;
            }

            if ch == ':' {
                self.add_token(TokenType::Colon, TokenValue::String(":".to_string()));
                self.advance();
                continue;
            }

            if ch == '-' {
                if self.is_next_digit() {
                    self.read_number()?;
                } else {
                    self.add_token(TokenType::Hyphen, TokenValue::String("-".to_string()));
                    self.advance();
                }
                continue;
            }

            if ch == ',' {
                self.add_token(TokenType::Comma, TokenValue::String(",".to_string()));
                self.advance();
                continue;
            }

            if ch == '(' {
                self.add_token(TokenType::LParen, TokenValue::String("(".to_string()));
                self.advance();
                continue;
            }

            if ch == ')' {
                self.add_token(TokenType::RParen, TokenValue::String(")".to_string()));
                self.advance();
                continue;
            }

            if ch == '{' {
                self.add_token(TokenType::LBrace, TokenValue::String("{".to_string()));
                self.advance();
                continue;
            }

            if ch == '}' {
                self.add_token(TokenType::RBrace, TokenValue::String("}".to_string()));
                self.advance();
                continue;
            }

            if ch == '[' {
                self.add_token(TokenType::LBracket, TokenValue::String("[".to_string()));
                self.advance();
                continue;
            }

            if ch == ']' {
                self.add_token(TokenType::RBracket, TokenValue::String("]".to_string()));
                self.advance();
                continue;
            }

            if ch == '"' {
                self.read_string()?;
                continue;
            }

            if Self::is_digit(ch) {
                self.read_number()?;
                continue;
            }

            if Self::is_identifier_start(ch) {
                self.read_identifier();
                continue;
            }

            return Err(format!("Unexpected character '{}' at line {}, column {}", ch, self.line, self.column));
        }

        while self.indent_stack.len() > 1 {
            self.indent_stack.pop();
            self.add_token(TokenType::Dedent, TokenValue::String("".to_string()));
        }

        self.add_token(TokenType::Eof, TokenValue::String("".to_string()));
        Ok(self.tokens.clone())
    }

    fn handle_indentation(&mut self) -> Result<(), String> {
        let mut indent_level = 0;
        let mut current_pos = self.pos;

        while current_pos < self.input.len() {
            let ch = self.input[current_pos];
            if ch == ' ' || ch == '\t' {
                if self.indent_char.is_none() {
                    self.indent_char = Some(ch);
                } else if Some(ch) != self.indent_char {
                    return Err(format!("Mixed indentation (spaces and tabs) at line {}", self.line));
                }

                if ch == ' ' {
                    indent_level += 1;
                } else {
                    indent_level += 4;
                }
            } else {
                break;
            }
            current_pos += 1;
        }

        if current_pos >= self.input.len() || self.input[current_pos] == '\n' || self.input[current_pos] == '#' {
            let indent_length = current_pos - self.pos;
            self.pos = current_pos;
            self.column += indent_length;
            return Ok(());
        }

        let current_indent = *self.indent_stack.last().unwrap();

        if indent_level > current_indent {
            self.indent_stack.push(indent_level);
            // In TS, INDENT token value is indentLevel
            self.add_token(TokenType::Indent, TokenValue::Number(indent_level as f64));
        } else if indent_level < current_indent {
            while self.indent_stack.len() > 1 && *self.indent_stack.last().unwrap() > indent_level {
                self.indent_stack.pop();
                self.add_token(TokenType::Dedent, TokenValue::String("".to_string()));
            }
        }

        let indent_length = current_pos - self.pos;
        self.pos = current_pos;
        self.column += indent_length;
        Ok(())
    }

    fn skip_comment(&mut self) {
        while self.pos < self.input.len() && self.peek().unwrap() != '\n' {
            self.advance();
        }
    }

    fn read_string(&mut self) -> Result<(), String> {
        let mut value = String::new();
        self.advance(); // Skip opening quote

        while self.pos < self.input.len() {
            let ch = self.peek().unwrap();
            if ch == '"' {
                self.advance(); // Skip closing quote
                self.add_token(TokenType::String, TokenValue::String(value));
                return Ok(());
            }
            if ch == '\\' {
                self.advance();
                if self.pos >= self.input.len() {
                    return Err(format!("Unterminated string at line {}", self.line));
                }
                let escape = self.peek().unwrap();
                match escape {
                    'n' => value.push('\n'),
                    'r' => value.push('\r'),
                    't' => value.push('\t'),
                    '\\' => value.push('\\'),
                    '"' => value.push('"'),
                    _ => value.push(escape),
                }
                self.advance();
            } else {
                value.push(ch);
                self.advance();
            }
        }
        Err(format!("Unterminated string at line {}", self.line))
    }

    fn read_number(&mut self) -> Result<(), String> {
        let mut value = String::new();
        if self.peek().unwrap() == '-' {
            value.push('-');
            self.advance();
        }

        while self.pos < self.input.len() {
            let ch = self.peek().unwrap();
            if Self::is_digit(ch) || ch == '.' || ch == 'e' || ch == 'E' || ch == '-' || ch == '+' {
                // '-' and '+' allowed for scientific notation (e.g., e-5)
                value.push(ch);
                self.advance();
            } else {
                break;
            }
        }

        if let Ok(num) = value.parse::<f64>() {
            self.add_token(TokenType::Number, TokenValue::Number(num));
            Ok(())
        } else {
            Err(format!("Invalid number format '{}' at line {}", value, self.line))
        }
    }

    fn read_identifier(&mut self) {
        let mut value = String::new();
        while self.pos < self.input.len() {
            let ch = self.peek().unwrap();
            if Self::is_identifier_part(ch) {
                value.push(ch);
                self.advance();
            } else {
                break;
            }
        }

        match value.as_str() {
            "true" => self.add_token(TokenType::Boolean, TokenValue::Boolean(true)),
            "false" => self.add_token(TokenType::Boolean, TokenValue::Boolean(false)),
            "null" => self.add_token(TokenType::Null, TokenValue::Null),
            _ => self.add_token(TokenType::Identifier, TokenValue::String(value)),
        }
    }

    fn peek(&self) -> Option<char> {
        if self.pos < self.input.len() {
            Some(self.input[self.pos])
        } else {
            None
        }
    }

    fn advance(&mut self) {
        self.pos += 1;
        self.column += 1;
    }

    fn add_token(&mut self, token_type: TokenType, value: TokenValue) {
        self.tokens.push(Token {
            token_type: token_type.clone(),
            value,
            line: self.line,
            column: self.column,
        });
        if !matches!(token_type, TokenType::Indent | TokenType::Dedent | TokenType::Newline | TokenType::Eof) {
            self.is_start_of_line = false;
        }
    }

    fn is_digit(ch: char) -> bool {
        ch.is_ascii_digit()
    }

    fn is_next_digit(&self) -> bool {
        if self.pos + 1 < self.input.len() {
            Self::is_digit(self.input[self.pos + 1])
        } else {
            false
        }
    }

    fn is_identifier_start(ch: char) -> bool {
        ch.is_ascii_alphabetic() || ch == '_' || ch == '$'
    }

    fn is_identifier_part(ch: char) -> bool {
        ch.is_ascii_alphanumeric() || ch == '_' || ch == '$' || ch == '.' || ch == '-'
    }
}
