#[macro_use]
mod errors;
mod lexer;
mod rpn;
mod simple_code_gen;
mod token;

use anyhow::Context;
use anyhow::Result;
pub use errors::*;
pub use lexer::*;
pub use rpn::*;
pub use simple_code_gen::*;
pub use std::f64::consts::*;
pub use std::f64::*;
pub use token::*;

pub fn eval(expression: &str) -> Result<f64, CalculatorError> {
    dbg!(expression);
    let tokens = parse_tokens(expression.to_string())?;
    let mut rpn = RPN::new();
    rpn.push_all(tokens)?;
    let mut simple = SimpleCodeGen::new(rpn.output);
    simple.eval()
}

#[cfg(test)]
mod test {
    use super::*;
    use anyhow::Result;
    use assert_approx_eq::assert_approx_eq;

    macro_rules! eval_test {
        ($id:ident, $expression:expr, $value:expr) => {
            #[test]
            fn $id() -> Result<(), CalculatorError> {
                assert_approx_eq!(eval($expression)?, $value as f64);
                Ok(())
            }
        };
        ($id:ident, $expression:expr) => {
            #[test]
            fn $id() -> Result<(), CalculatorError> {
                assert_eq!($expression, true);
                Ok(())
            }
        };
    }

    eval_test!(eq1, eval("1+").is_err());
    eval_test!(eq2, eval("=").is_err());
    eval_test!(eq3, eval("1E1.5").is_err());
    eval_test!(eq4, eval("NaN")?.is_nan());
    eval_test!(eq5, eval("Inf")?.is_infinite());
    eval_test!(eq6, eval("Infinity")?.is_infinite());
    eval_test!(eq7, eval("-Inf")?.is_infinite());
    eval_test!(eq8, eval("0/0")?.is_nan());
    eval_test!(eq9, eval("(2,").is_err());

    eval_test!(ok1, "1", 1);
    eval_test!(ok2, "π", PI);
    eval_test!(ok3, "2×3", 6);
    eval_test!(ok4, "1+√9*2", 7);
    eval_test!(ok5, "3√4", 6);
    eval_test!(ok6, "√16*sin(2pi/4)", 4);
    eval_test!(ok7, "1+1", 2);
    eval_test!(ok8, "1+-1", 0);
    eval_test!(ok9, "1+1", 2);
    eval_test!(ok10, "-0.5", -0.5);
    eval_test!(ok12, "+1e2", 100);
    eval_test!(ok13, "1e-1", 0.1);
    eval_test!(ok14, "1e−1", 0.1);
    eval_test!(ok15, "-2^3!", -64);
    eval_test!(ok16, "(-2)^3!", 64);
    eval_test!(ok17, "-2^1^2", -2);
    eval_test!(ok18, "--1", 1);
    eval_test!(ok19, "-3^--2", -9);
    eval_test!(ok20, "1+2)(2+3", 15);
    eval_test!(ok21, "1+2)!^-2", 1.0 / 36.0);
    eval_test!(ok22, "sin(0)", 0);
    eval_test!(ok23, "cos(0)", 1);
    eval_test!(ok24, "sin(-1--1)", 0);
    eval_test!(ok25, "-(2+1)*-(4/2)", 6);
    eval_test!(ok26, "-0.5E-1", -0.05);
    eval_test!(ok28, "2 3 4", 24);
    eval_test!(ok29, "pi", PI);
    eval_test!(ok30, "e", E);
    eval_test!(ok36, "5 % 3", 2);
    eval_test!(ok37, "5.2 % 3.2", 2);
    eval_test!(ok38, "100.1-100-0.1", 0);
    eval_test!(ok39, "1.1-1+(-0.1)", 0);
    eval_test!(ok40, "log(2,8)", 3);
    eval_test!(ok41, "log(9,81)", 2);
    eval_test!(ok42, "log(4,2)", 0.5);
    eval_test!(ok43, "ln(e)", 1);
    eval_test!(ok44, "log10(10)", 1);
    eval_test!(ok45, "log10(100)", 2);
    eval_test!(ok46, "lg(0.1)", -1);
    eval_test!(ok47, "log2(2)", 1);
    eval_test!(ok48, "lb(256)", 8);
    eval_test!(ok49, "rnd(0,10)*0", 0);
    eval_test!(ok50, "max(2,3)", 3);
    eval_test!(ok51, "min(2,3)", 2);
    eval_test!(ok52, "cbrt(8)", 2);
    eval_test!(ok53, "cbrt(-8)", -2);
    eval_test!(ok54, "∛-8", -2);
}

#[derive(Default)]
pub struct Calculator {
    pub expression: String,
    pub value: f64,
}
