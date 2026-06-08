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
