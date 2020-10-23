use crate::calculator;

use seed::{prelude::*, *};

fn init(_: Url, _: &mut impl Orders<Msg>) -> Model {
    Model::default()
}

type Model = calculator::Calculator;

#[derive(Clone)]
// `Msg` describes the different events you can modify state with.
enum Msg {
    ExpressionChanged(String),
    Eval,
}

// `update` describes how to handle each `Msg`.
fn update(msg: Msg, model: &mut Model, _: &mut impl Orders<Msg>) {
    match msg {
        Msg::ExpressionChanged(expression) => {
            model.expression = expression;
        }
        Msg::Eval => {
            model.value = calculator::eval(&model.expression).unwrap();
        }
    }
}

#[allow(clippy::trivially_copy_pass_by_ref)]
// `view` describes what to display.
fn view(model: &Model) -> Node<Msg> {
    div![
        C!["counter"],
        input![
            attrs! {
                At::Value => model.expression
            },
            input_ev(Ev::Input, Msg::ExpressionChanged)
        ],
        " ",
        button!["=", ev(Ev::Click, |_| Msg::Eval)],
        " ",
        model.value
    ]
}

#[wasm_bindgen(start)]
pub fn start() {
    // Mount the `app` to the element with the `id` "app".
    App::start("app", init, update, view);
}
