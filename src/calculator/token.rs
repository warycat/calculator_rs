pub const TOK_ADD: Tok = Tok::Operator(Op::Add);
pub const TOK_SUB: Tok = Tok::Operator(Op::Sub);
pub const TOK_MUL: Tok = Tok::Operator(Op::Mul);
pub const TOK_DIV: Tok = Tok::Operator(Op::Div);
pub const TOK_MOD: Tok = Tok::Operator(Op::Mod);
pub const TOK_UMIN: Tok = Tok::Operator(Op::Umin);
pub const TOK_POWER: Tok = Tok::Operator(Op::Power);
pub const TOK_SQRT: Tok = Tok::Operator(Op::Sqrt);
pub const TOK_CBRT: Tok = Tok::Operator(Op::Cbrt);

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Tok {
    Number(String),
    Const(String),
    Call(String, usize),
    Operator(Op),
    Factorial,
    LParen,
    RParen,
    Comma,
    End,
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Op {
    Add,
    Sub,
    Mod,
    Mul,
    Div,
    Umin,
    Power,
    Sqrt,
    Cbrt,
}

impl Tok {
    pub fn is_right_associtive(&self) -> bool {
        match self {
            Tok::Operator(Op::Power) => true,
            _ => false,
        }
    }

    pub fn is_prefix(&self) -> bool {
        match self {
            Tok::Call(_, _) | Tok::LParen | &TOK_UMIN | &TOK_SQRT | &TOK_CBRT=> true,
            _ => false,
        }
    }

    pub fn is_operand(&self) -> bool {
        match self {
            Tok::Number(_) | Tok::Const(_) | Tok::RParen | Tok::Factorial  => true,
            _ => false,
        }
    }

    pub fn priority(&self) -> i32 {
        match self {
            Tok::End | Tok::Call(_, _) => 0,
            Tok::LParen => 1,
            Tok::Comma => 2,
            Tok::RParen => 3,
            &TOK_ADD | &TOK_SUB => 4,
            &TOK_MUL | &TOK_DIV | &TOK_MOD => 5,
            &TOK_UMIN => 6,
            &TOK_POWER => 7,
            Tok::Factorial => 8,
            &TOK_SQRT | &TOK_CBRT => 10,
            Tok::Number(_) | Tok::Const(_) => 20,
        }
    }
}


#[derive(Debug, PartialEq, Eq, Clone)]
pub struct Token {
    pub tok: Tok,
    pub pos: usize,
}

impl Token {
    pub fn new(tok: Tok, pos: usize) -> Self {
        Token { tok, pos }
    }
}
