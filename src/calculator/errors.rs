use thiserror::Error;

#[derive(Error, Debug)]
pub enum CalculatorError {
    #[error("Runtime")]
    Runtime(String),
    #[error("Syntax")]
    Syntax(String, usize),
}


macro_rules! runtime {
    ($message:expr) => {
        Err( CalculatorError::Runtime($message))
    };
}

macro_rules! syntax {
    ($message:expr, $position:expr) => {
        Err(CalculatorError::Syntax($message, $position))
    };
}

