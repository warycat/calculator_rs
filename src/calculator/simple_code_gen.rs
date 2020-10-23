use super::*;
use factorial::Factorial;
use mathru::special::gamma::gamma;
use rand::random;
use std::collections::HashMap;
use anyhow::Result;
use rand::prelude::*;

enum Function {
    Sin,
    Cos,
    Log,
    Log2,
    Log10,
    Ln,
    Lg,
    Lb,
    Asin,
    Acos,
    Rnd,
    Max,
    Min,
    Sqrt,
    Cbrt,
}

impl Function {
    fn eval(&self, stack: &mut Vec<f64>, arity: usize) -> Result<(), CalculatorError> {
        let x = stack.pop().unwrap();
        let z = match self {
            Function::Sin => {
                if arity != 1 {
                    return runtime!(format!("wrong no of arguments"));
                }
                x.sin()
            }
            Function::Cos => {
                x.cos()
            }
            Function::Log => {
                let y = stack.pop().unwrap();
                x.log(y)
            }
            Function::Ln => {
                x.ln()
            }
            Function::Log10 | Function::Lg => {
                x.log(10.0)
            }
            Function::Log2 | Function::Lb => {
                x.log(2.0)
            }
            Function::Asin => {
                x.asin()
            }
            Function::Acos => {
                x.acos()
            }
            Function::Rnd => {
                let y = stack.pop().unwrap();
                let mut rng = rand::thread_rng();
                rng.gen_range(y,x)
            }
            Function::Max => {
                let y = stack.pop().unwrap();
                x.max(y)
            }
            Function::Min => {
                let y = stack.pop().unwrap();
                x.min(y)
            }
            Function::Sqrt => {
                x.sqrt()
            }
            Function::Cbrt => {
                x.cbrt()
            }
        };
        stack.push(z);
        Ok(())
    }
}

pub struct SimpleCodeGen {
    rpn: Vec<Tok>,
    consts: HashMap<String, f64>,
    functions: HashMap<String, Function>,
    stack: Vec<f64>,
}

impl SimpleCodeGen {
    pub fn new(rpn: Vec<Tok>) -> Self {
        let mut consts = HashMap::new();
        let mut functions = HashMap::new();
        consts.insert("π".to_string(), PI);
        consts.insert("pi".to_string(), PI);
        consts.insert("e".to_string(), E);
        consts.insert("NaN".to_string(), NAN);
        consts.insert("Inf".to_string(), INFINITY);
        consts.insert("Infinity".to_string(), INFINITY);
        functions.insert("sin".to_string(), Function::Sin);
        functions.insert("cos".to_string(), Function::Cos);
        functions.insert("log".to_string(), Function::Log);
        functions.insert("asin".to_string(), Function::Asin);
        functions.insert("acos".to_string(), Function::Acos);
        functions.insert("ln".to_string(), Function::Ln);
        functions.insert("log2".to_string(), Function::Log2);
        functions.insert("log10".to_string(), Function::Log10);
        functions.insert("lb".to_string(), Function::Lb);
        functions.insert("lg".to_string(), Function::Lg);
        functions.insert("rnd".to_string(), Function::Rnd);
        functions.insert("max".to_string(), Function::Max);
        functions.insert("min".to_string(), Function::Min);
        functions.insert("sqrt".to_string(), Function::Sqrt);
        functions.insert("cbrt".to_string(), Function::Cbrt);
        let stack = vec![];
        SimpleCodeGen {
            rpn,
            consts,
            functions,
            stack,
        }
    }
    pub fn eval(&mut self) -> Result<f64, CalculatorError> {
        dbg!(&self.rpn);
        let mut stack = vec![];
        for tok in self.rpn.drain(..) {
            match tok {
                Tok::Number(num) => {
                    if let Ok(value) = num.parse::<f64>() {
                        stack.push(value);
                    } else {
                        return runtime!(format!("parse number"));
                    }
                }
                Tok::Const(name) => {
                    if let Some(&value) = self.consts.get(&name) {
                        stack.push(value);
                    } else {
                        return runtime!(format!("const number"));
                    }
                }
                Tok::Call(name, arity) => {
                    if let Some(function) = self.functions.get(&name) {
                        function.eval(&mut stack, arity)?;
                    } else {
                        return runtime!(format!("function not found"));
                    }
                }
                Tok::Operator(op) => match op {
                    Op::Add => {
                        let b = stack.pop().unwrap();
                        let a = stack.pop().unwrap();
                        stack.push(a + b);
                    }
                    Op::Sub => {
                        let b = stack.pop().unwrap();
                        let a = stack.pop().unwrap();
                        stack.push(a - b);
                    }
                    Op::Mul => {
                        let b = stack.pop().unwrap();
                        let a = stack.pop().unwrap();
                        stack.push(a * b);
                    }
                    Op::Div => {
                        let b = stack.pop().unwrap();
                        let a = stack.pop().unwrap();
                        stack.push(a / b);
                    }
                    Op::Mod => {
                        let b = stack.pop().unwrap();
                        let a = stack.pop().unwrap();
                        stack.push(a % b);
                    }
                    Op::Power => {
                        let b = stack.pop().unwrap();
                        let a = stack.pop().unwrap();
                        stack.push(a.powi(b as i32));
                    }
                    Op::Umin => {
                        let a = stack.pop().unwrap();
                        stack.push(-a);
                    }
                    Op::Sqrt => {
                        let a = stack.pop().unwrap();
                        stack.push(a.sqrt());
                    }
                    Op::Cbrt => {
                        let a = stack.pop().unwrap();
                        stack.push(a.cbrt());
                    }
                },
                Tok::Factorial => {
                    let a = stack.pop().unwrap();
                    stack.push(gamma(a + 1.0));
                }
                _ => {}
            }
        }
        Ok(stack.pop().unwrap())
    }
}
