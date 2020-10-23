use super::*;
use anyhow::Context;

pub fn parse_tokens(mut s: String) -> Result<Vec<Token>, CalculatorError> {
    if let Some(position) = s.find('$') {
        return syntax!(format!("syntax 1"), position);
    } else {
        s.push('$');
        let mut it = s.char_indices().peekable();
        let mut res = vec![];
        while let Some((i, c)) = it.next() {
            let token = match c {
                '$' => Token::new(Tok::End, i),
                '!' => Token::new(Tok::Factorial, i),
                '(' => Token::new(Tok::LParen, i),
                ')' => Token::new(Tok::RParen, i),
                ',' => Token::new(Tok::Comma, i),
                '%' => Token::new(TOK_MOD, i),
                '+' => Token::new(TOK_ADD, i),
                '-' => Token::new(TOK_SUB, i),
                '*' | '×' => Token::new(TOK_MUL, i),
                '/' | '÷' => Token::new(TOK_DIV, i),
                '√' => Token::new(TOK_SQRT, i),
                '∛' => Token::new(TOK_CBRT, i),
                '^' => Token::new(TOK_POWER, i),
                'π' => Token::new(Tok::Const(format!("{}", c)), i),
                '0'..='9' => {
                    let mut num_string = "".to_string();
                    num_string.push(c);
                    let mut exp = false;
                    while let Some(&(_, c)) = it.peek() {
                        match c {
                            '0'..='9' | '.'  => {
                                num_string.push(c);
                                it.next();
                            }
                            'e' | 'E' => {
                                if exp {
                                    break;
                                }else{
                                    exp = true;
                                    num_string.push(c);
                                    it.next();
                                }
                            }
                            '−' | '-' => {
                                if !exp {
                                    break;
                                }
                                num_string.push('-');
                                it.next();
                            }
                            _ => break,
                        }
                    }
                    if let Ok(num) = num_string.parse::<f64>() {
                        Token::new(Tok::Number(num.to_string()), i)
                    } else {
                        return syntax!(format!("syntax 2"), i);
                    }
                }
                'a'..='z' | 'A'..='Z' => {
                    let mut name = "".to_string();
                    name.push(c);
                    while let Some(&(_, c)) = it.peek() {
                        match c {
                            'a'..='z' | 'A'..='Z' | '0'..='9' => {
                                name.push(c);
                                it.next();
                            }
                            _ => break,
                        }
                    }
                    while let Some((_, c)) = it.peek() {
                        if c.is_whitespace() {
                            it.next();
                        } else {
                            break;
                        }
                    }
                    if let Some((_, '(')) = it.peek() {
                        it.next();
                        Token::new(Tok::Call(name, 1), i)
                    } else {
                        Token::new(Tok::Const(name), i)
                    }
                }
                ' ' | '\t' | '\n' | '\r' => {
                    continue;
                }
                _ => {
                    return syntax!(format!("syntax 1"), i);
                }
            };
            res.push(token);
        }
        Ok(res)
    }
}
