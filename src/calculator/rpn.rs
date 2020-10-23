use super::*;
use anyhow::Result;
use errors::CalculatorError;


type PrevTok = Option<Tok>;

trait TokenHelper {
    fn is_operand(&self) -> bool;
    fn is_call(&self) -> bool;
}

impl TokenHelper for PrevTok {
    fn is_operand(&self) -> bool {
        if let Some(tok) = self {
            tok.is_operand()
        } else {
            false
        }
    }
    fn is_call(&self) -> bool {
        if let Some(Tok::Call(_, _)) = self {
            true
        } else {
            false
        }
    }
}

pub struct RPN {
    stack: Vec<Tok>,
    pub output: Vec<Tok>,
    prev_tok: PrevTok,
}

impl RPN {
    pub fn new() -> Self {
        let stack = vec![];
        let output = vec![];
        let prev_tok = None;
        RPN {
            stack,
            output,
            prev_tok,
        }
    }

    pub fn push_all(&mut self, tokens: Vec<Token>) -> Result<(), CalculatorError> {
        for token in tokens {
            self.push(token)?;
        }
        Ok(())
    }

    fn push(&mut self, token: Token) -> Result<(), CalculatorError> {
        let tok = token.tok;
        let pos = token.pos;
        let priority = tok.priority();
        match tok {
            Tok::Number(_) | Tok::Const(_) => {
                if self.prev_tok.is_operand() {
                    self.push(Token::new(TOK_MUL, pos))?;
                }
                self.output.push(tok.clone());
            }
            Tok::RParen => {
                if self.prev_tok.is_call() || !self.prev_tok.is_operand() {
                    return syntax!(format!("syntax RParen 1"), pos);
                }
                self.pop_higher(priority);
                let t = self.stack.last().cloned();
                if t.is_call() {
                    self.pop();
                } else {
                    if t.is_some() {
                        if t == Some(Tok::LParen) {
                            self.stack.pop().unwrap();
                        }else{
                            return syntax!(format!("syntax RParen 2"), pos);
                        }
                    }
                }
            }
            Tok::Comma => {
                if !self.prev_tok.is_operand() {
                    return syntax!(format!("syntax Comma 1"), pos);
                }
                self.pop_higher(priority);
                let t: Option<Tok> = self.stack.last().cloned();
                if t.is_none() || !t.is_call() {
                    dbg!(&t);
                    return syntax!(format!("syntax Comma 2"), pos);
                }
            }
            Tok::End => {
                while !self.stack.is_empty() {
                    self.push(Token::new(Tok::RParen, pos))?;
                }
            }
            Tok::Operator(_) | Tok::LParen | Tok::Call(_, _) | Tok::Factorial => {
                if tok.is_prefix() {
                    if self.prev_tok.is_operand() {
                        self.push(Token::new(TOK_MUL, pos))?;
                    }
                    self.stack.push(tok.clone());
                } else {
                    if !self.prev_tok.is_operand() {
                        match tok {
                            TOK_SUB => {
                                self.stack.push(TOK_UMIN);
                            }
                            TOK_ADD => {
                                return Ok(());
                            }
                            _ => {
                                return syntax!(format!("syntax Operator 1"), pos);
                            }
                        }
                    }else{
                        self.pop_higher(priority + if tok.is_right_associtive() { 1 } else { 0 });
                        self.stack.push(tok.clone());    
                    }
                }
            }
        }
        self.prev_tok = Some(tok);
        Ok(())
    }

    fn pop_higher(&mut self, priority: i32) {
        while let Some(tok) = self.stack.last() {
            if tok.priority() >= priority {
                self.pop()
            } else {
                break;
            }
        }
    }

    fn pop(&mut self) {
        self.output.push(self.stack.pop().unwrap());
    }
}
