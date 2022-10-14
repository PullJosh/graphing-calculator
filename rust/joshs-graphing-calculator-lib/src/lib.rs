use wasm_bindgen::prelude::*;
extern crate nalgebra as na;

mod ast;
mod equation;
mod expression;
mod graphing;

use equation::*;
use expression::*;
use graphing::graph_equation_2d;

use serde_json::Value;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: String);
}

#[wasm_bindgen]
pub fn test(math_json: String) -> String {
    let value: Value = serde_json::from_str(&math_json).unwrap();

    let equation = mathjson_value_to_equation(&value).unwrap();
    let expression = Plus::new(vec![
        equation.left.clone(),
        Box::new(Minus::new(equation.right.clone())),
    ]);

    log(format!("Equation: {:?}", &equation));
    log(format!("Expression: {:?}", &expression));
    log(format!(
        "Derivative (x): {:?} = {:?}",
        &expression.derivative("x"),
        &expression.derivative("x").basic_simplify()
    ));
    log(format!(
        "Derivative (y): {:?} = {:?}",
        &expression.derivative("y"),
        &expression.derivative("y").basic_simplify()
    ));

    let window = graphing::GraphBox {
        x_min: -10.0,
        x_max: 10.0,
        y_min: -10.0,
        y_max: 10.0,
    };

    let graphed_equation = graph_equation_2d("x", "y", &window, &equation);

    let json = serde_json::to_string(&graphed_equation).unwrap();
    return json;
}

fn mathjson_value_to_equation(value: &Value) -> Option<Equation> {
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
                _ => None,
            }
        }
        _ => None,
    }
}
