use wasm_bindgen::prelude::*;
extern crate console_error_panic_hook;

extern crate nalgebra as na;

mod ast;
mod equation;
mod expression;
mod graphing;
mod point;
mod segment;
mod triangle;
mod vector;

use equation::*;
use expression::*;
use graphing::*;
use point::*;
use segment::*;
use vector::*;

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

    fn f(Point2D(x, y): Point2D) -> f64 {
        y - x * x
    }

    fn df(Point2D(x, _y): Point2D) -> Vec2D {
        Vec2D(-2.0 * x, 1.0)
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
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    depth: i64,
    search_depth: i64,
) -> Result<Vec<Contour2D>, String> {
    console_error_panic_hook::set_once();

    let value: Value = serde_json::from_str(&math_json).unwrap();

    let equation = mathjson_value_to_equation(&value);

    if let Some(equation) = equation {
        let window = GraphBox::new(x_min, x_max, y_min, y_max);
        return graph_equation_2d("x", "y", &window, &equation, depth, search_depth);
    }

    return Err("Could not parse equation".to_string());
}

#[wasm_bindgen]
pub fn graph_equation_to_float_array(
    math_json: String,
    // scale: i64,
    // x: i64,
    // y: i64,
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    depth: i64,
    search_depth: i64,
) -> Result<Vec<f64>, String> {
    console_error_panic_hook::set_once();

    let graphed_equation =
        graph_equation(math_json, x_min, x_max, y_min, y_max, depth, search_depth)?;

    let mut total_length = graphed_equation
        .iter()
        .fold(0, |acc, contour| acc + 2 * contour.len());
    total_length += graphed_equation.len() * 2;

    let mut float_array = Vec::with_capacity(total_length);
    for contour in graphed_equation {
        for point in contour {
            float_array.push(point.0);
            float_array.push(point.1);
        }
        float_array.push(std::f64::INFINITY);
        float_array.push(std::f64::INFINITY);
    }

    Ok(float_array)
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
        Value::Number(n) => Some(Box::new(Constant::new(n.as_f64()?))),
        Value::String(s) => match s.as_str() {
            "Pi" => Some(Box::new(Constant::new(std::f64::consts::PI))),
            "ExponentialE" => Some(Box::new(Constant::new(std::f64::consts::E))),
            "Nothing" => None,
            _ => Some(Box::new(Variable::new(s.to_string()))),
        },
        Value::Array(a) => {
            let operator = a[0].as_str()?;
            let mut operands: Vec<Box<dyn Expression>> = Vec::new();
            for operand in a[1..].iter() {
                operands.push(mathjson_value_to_expression(operand)?);
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
                "Negate" => Some(Box::new(Minus::new(operands[0].clone()))),
                "Power" => Some(Box::new(Power::new(
                    operands[0].clone(),
                    operands[1].clone(),
                ))),
                "Ln" => Some(Box::new(Log::new(std::f64::consts::E, operands[0].clone()))),
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
