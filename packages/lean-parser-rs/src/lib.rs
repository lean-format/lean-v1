use wasm_bindgen::prelude::*;
use js_sys::{Error, JSON};

pub mod lexer;
pub mod parser;

use parser::LeanParser;

#[wasm_bindgen]
pub fn parse(input: &str, strict: Option<bool>) -> Result<JsValue, JsValue> {
    let is_strict = strict.unwrap_or(false);
    let mut parser = LeanParser::new(is_strict);

    match parser.parse(input) {
        Ok(val) => {
            let json_str = val.to_string();
            JSON::parse(&json_str).map_err(|e| Error::new(&format!("{:?}", e)).into())
        },
        Err(e) => Err(Error::new(&e).into()),
    }
}

#[wasm_bindgen]
pub fn parse_with_limits(
    input: &str,
    strict: Option<bool>,
    max_depth: Option<usize>,
    max_input_size: Option<usize>,
) -> Result<JsValue, JsValue> {
    let is_strict = strict.unwrap_or(false);
    let depth = max_depth.unwrap_or(100);
    let size_limit = max_input_size.unwrap_or(10 * 1024 * 1024);
    let mut parser = LeanParser::with_limits(is_strict, depth, size_limit);

    match parser.parse(input) {
        Ok(val) => {
            let json_str = val.to_string();
            JSON::parse(&json_str).map_err(|e| Error::new(&format!("{:?}", e)).into())
        },
        Err(e) => Err(Error::new(&e).into()),
    }
}
