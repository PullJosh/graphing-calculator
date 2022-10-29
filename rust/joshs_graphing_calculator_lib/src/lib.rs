use wasm_bindgen::prelude::*;
extern crate console_error_panic_hook;

extern crate nalgebra as na;

mod ast;
mod equation;
mod expression;
mod graphing;
mod point;

use equation::*;
use expression::*;
use graphing::*;
use point::*;

use serde_json::Value;

pub use graphing::graph_equation_2d;
pub use graphing::GraphBox;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: String);
}

// Main function for testing purposes (so we can test stuff
// without calling it from JavaScript)
pub fn main() {
    use std::time::Instant;

    let now = Instant::now();

    let area = GraphBox::new(1.0, 2.0, 1.0, 2.0);

    println!("{:?}", Point1D(1.0) + Point1D(2.0));

    fn f(x: f64, y: f64) -> f64 {
        y - x * x
    }

    fn df(x: f64, y: f64) -> (f64, f64) {
        (-2.0 * x, 1.0)
    }
    let df = get_cheating_gradient(&df);

    for _ in 0..10000 {
        get_leaf_key_points(&area, &f, &df);
    }

    let elapsed = now.elapsed();
    println!("Elapsed: {:.2?}", elapsed);
}

pub fn graph_equation(
    math_json: String,
    scale: i64,
    x: i64,
    y: i64,
    depth: i64,
    search_depth: i64,
) -> Vec<Contour> {
    console_error_panic_hook::set_once();

    let value: Value = serde_json::from_str(&math_json).unwrap();

    let equation = mathjson_value_to_equation(&value).unwrap();

    let window = GraphBox::new(
        2.0_f64.powf(scale as f64) * x as f64,
        2.0_f64.powf(scale as f64) * (x + 1) as f64,
        2.0_f64.powf(scale as f64) * y as f64,
        2.0_f64.powf(scale as f64) * (y + 1) as f64,
    );

    graph_equation_2d("x", "y", &window, &equation, depth, search_depth)
}

#[wasm_bindgen]
pub fn graph_equation_to_contours_json(
    math_json: String,
    scale: i64,
    x: i64,
    y: i64,
    depth: i64,
    search_depth: i64,
) -> String {
    console_error_panic_hook::set_once();

    let graphed_equation = graph_equation(math_json, scale, x, y, depth, search_depth);
    let contours_json = serde_json::to_string(&graphed_equation).unwrap();
    return contours_json;
}

pub fn mathjson_value_to_equation(value: &Value) -> Option<Equation> {
    console_error_panic_hook::set_once();

    if let Value::Array(a) = value {
        if a.len() != 3 {
            return None;
        }

        let operator = if let Value::String(s) = &a[0] {
            s.as_str()
        } else {
            return None;
        };

        let operator = match operator {
            "Less" => ComparisonOperator::LessThan,
            "LessEqual" => ComparisonOperator::LessThanOrEqual,
            "Equal" => ComparisonOperator::Equal,
            "GreaterEqual" => ComparisonOperator::GreaterThanOrEqual,
            "Greater" => ComparisonOperator::GreaterThan,
            "NotEqual" => ComparisonOperator::NotEqual,
            _ => return None,
        };

        let left = mathjson_value_to_expression(&a[1]);
        let right = mathjson_value_to_expression(&a[2]);
        if let (Some(left), Some(right)) = (left, right) {
            return Some(Equation::new(left, right, operator));
        } else {
            return None;
        }
    }

    None
}

fn mathjson_value_to_expression(value: &Value) -> Option<Box<dyn Expression>> {
    console_error_panic_hook::set_once();

    match value {
        Value::Number(n) => Some(Box::new(Constant::new(n.as_f64().unwrap()))),
        Value::String(s) => match s.as_str() {
            "Pi" => Some(Box::new(Constant::new(std::f64::consts::PI))),
            _ => Some(Box::new(Variable::new(s.to_string()))),
        },
        Value::Array(a) => {
            let operator = a[0].as_str().unwrap();
            let mut operands: Vec<Box<dyn Expression>> = Vec::new();
            for operand in a[1..].iter() {
                operands.push(mathjson_value_to_expression(operand).unwrap());
            }

            match operator {
                "Add" => Some(Box::new(Plus::new(operands))),
                "Subtract" => {
                    for i in 1..operands.len() {
                        operands[i] = Box::new(Minus::new(operands[i].clone()));
                    }
                    Some(Box::new(Plus::new(operands)))
                }
                "Multiply" => Some(Box::new(Times::new(operands))),
                "Divide" => {
                    for i in 1..operands.len() {
                        operands[i] = Box::new(Inverse::new(operands[i].clone()));
                    }
                    Some(Box::new(Times::new(operands)))
                }
                "Power" => Some(Box::new(Power::new(
                    operands[0].clone(),
                    operands[1].clone(),
                ))),
                "Sin" => Some(Box::new(Sin::new(operands[0].clone()))),
                "Cos" => Some(Box::new(Cos::new(operands[0].clone()))),
                "Tan" => Some(Box::new(Tan::new(operands[0].clone()))),
                "Abs" => Some(Box::new(Abs::new(operands[0].clone()))),
                "Delimiter" => Some(operands[0].clone()),
                "Rational" => Some(Box::new(Times::new(vec![
                    operands[0].clone(),
                    Box::new(Inverse::new(operands[1].clone())),
                ]))),
                _ => None,
            }
        }
        _ => None,
    }
}
