use std::collections::HashMap;

use triangle::Triangle3D;
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
    var1: &String, // Variable to use as "x" axis
    var2: &String, // Variable to use as "y" axis
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    depth: i64,
    search_depth: i64,
    var_values: JsValue, // HashMap<String, f64>,
) -> Result<Vec<Contour2D>, String> {
    console_error_panic_hook::set_once();

    let value: Value = serde_json::from_str(&math_json).unwrap();
    let equation = mathjson_value_to_equation(&value);

    let var_values: HashMap<String, f64> = serde_wasm_bindgen::from_value(var_values).unwrap();

    if let Some(equation) = equation {
        let window = GraphBox::new(x_min, x_max, y_min, y_max);
        return graph_equation_2d(
            var1,
            var2,
            &window,
            &equation,
            depth,
            search_depth,
            &var_values,
        );
    }

    return Err("Could not parse equation".to_string());
}

#[wasm_bindgen]
pub fn graph_equation_to_float_array(
    math_json: String,
    var1: String,
    var2: String,
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    depth: i64,
    search_depth: i64,
    var_values: JsValue, // HashMap<String, f64>,
) -> Result<Vec<f64>, String> {
    console_error_panic_hook::set_once();

    let graphed_equation = graph_equation(
        math_json,
        &var1,
        &var2,
        x_min,
        x_max,
        y_min,
        y_max,
        depth,
        search_depth,
        var_values,
    )?;

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

pub fn graph_equation_3d(
    math_json: String,
    var1: &String, // Variable to use as "x" axis
    var2: &String, // Variable to use as "y" axis
    var3: &String, // Variable to use as "z" axis
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    z_min: f64,
    z_max: f64,
    var_values: JsValue, // HashMap<String, f64>,
) -> Result<Vec<Triangle3D>, String> {
    console_error_panic_hook::set_once();

    let var_values: HashMap<String, f64> = serde_wasm_bindgen::from_value(var_values).unwrap();

    let value: Value = serde_json::from_str(&math_json).unwrap();

    let equation = mathjson_value_to_equation(&value);

    if let Some(equation) = equation {
        let window = GraphBox3D::new(x_min, x_max, y_min, y_max, z_min, z_max);
        return graphing::graph_equation_3d(var1, var2, var3, &window, &equation, &var_values);
    }

    Err("Could not parse equation".to_string())
}

#[wasm_bindgen]
pub fn graph_equation_to_float_array_3d(
    math_json: String,
    var1: String,
    var2: String,
    var3: String,
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    z_min: f64,
    z_max: f64,
    var_values: JsValue, // HashMap<String, f64>,
) -> Result<Vec<f64>, String> {
    console_error_panic_hook::set_once();

    let graphed_equation = graph_equation_3d(
        math_json, &var1, &var2, &var3, x_min, x_max, y_min, y_max, z_min, z_max, var_values,
    )?;

    let total_length = graphed_equation.len() * 3 * 3;

    let mut float_array = Vec::with_capacity(total_length);
    for triangle in graphed_equation {
        for point in triangle {
            float_array.push(point.0);
            float_array.push(point.1);
            float_array.push(point.2);
        }
    }

    Ok(float_array)
}

#[wasm_bindgen]
pub fn graph_vector_field(
    math_json: JsValue, // Vec<String>,
    step: f64,
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    z_min: f64,
    z_max: f64,
    var_values: JsValue, // HashMap<String, f64>,
) -> Result<Vec<f64>, String> {
    let math_json: Vec<String> = serde_wasm_bindgen::from_value(math_json).unwrap();

    let mut var_values: HashMap<String, f64> = serde_wasm_bindgen::from_value(var_values).unwrap();

    let expressions = math_json
        .iter()
        .map(|s| mathjson_value_to_expression(&serde_json::from_str(s).unwrap()))
        .collect::<Option<Vec<Box<dyn Expression>>>>()
        .unwrap();

    let x_min = (x_min / step).floor() as i64;
    let x_max = (x_max / step).ceil() as i64;
    let y_min = (y_min / step).floor() as i64;
    let y_max = (y_max / step).ceil() as i64;
    let z_min = (z_min / step).floor() as i64;
    let z_max = (z_max / step).ceil() as i64;

    let capacity: usize = (x_max - x_min + 1) as usize
        * (y_max - y_min + 1) as usize
        * (z_max - z_min + 1) as usize
        * (3 + expressions.len());

    let mut result = vec![0.0; capacity];

    let mut i = 0;
    for x in x_min..=x_max {
        var_values.insert("x".to_string(), (x as f64) * step);

        for y in y_min..=y_max {
            var_values.insert("y".to_string(), (y as f64) * step);

            for z in z_min..=z_max {
                var_values.insert("z".to_string(), (z as f64) * step);

                result[i + 0] = (x as f64) * step;
                result[i + 1] = (y as f64) * step;
                result[i + 2] = (z as f64) * step;
                i += 3;
                for expression in &expressions {
                    result[i] = expression.evaluate(&var_values)?;
                    i += 1;
                }
            }
        }
    }

    Ok(result)
}

#[wasm_bindgen]
pub fn graph_vector_field_paths(
    math_json: JsValue, // Vec<String>,
    number_of_paths: usize,
    path_length: usize,
    step_epsilon: f64,
    x_min: f64,
    x_max: f64,
    y_min: f64,
    y_max: f64,
    z_min: f64,
    z_max: f64,
    var_values: JsValue, // HashMap<String, f64>,
) -> Result<Vec<f64>, String> {
    let math_json: Vec<String> = serde_wasm_bindgen::from_value(math_json).unwrap();

    let mut var_values: HashMap<String, f64> = serde_wasm_bindgen::from_value(var_values).unwrap();

    let expressions = math_json
        .iter()
        .map(|s| mathjson_value_to_expression(&serde_json::from_str(s).unwrap()))
        .collect::<Option<Vec<Box<dyn Expression>>>>()
        .unwrap();

    let mut result = vec![0.0; number_of_paths * path_length * 3];
    use rand::Rng;
    let mut rng: rand::rngs::StdRng = rand::SeedableRng::seed_from_u64(0);
    for i in 0..number_of_paths {
        let mut x = rng.gen::<f64>() * (x_max - x_min) + x_min;
        let mut y = rng.gen::<f64>() * (y_max - y_min) + y_min;
        let mut z = rng.gen::<f64>() * (z_max - z_min) + z_min;

        for j in 0..path_length {
            var_values.insert("x".to_string(), x);
            var_values.insert("y".to_string(), y);
            var_values.insert("z".to_string(), z);

            result[i * path_length * 3 + j * 3 + 0] = x;
            result[i * path_length * 3 + j * 3 + 1] = y;
            result[i * path_length * 3 + j * 3 + 2] = z;

            if let Some(expr_x) = expressions.get(0) {
                x += expr_x.evaluate(&var_values)? * step_epsilon;
            }
            if let Some(expr_y) = expressions.get(1) {
                y += expr_y.evaluate(&var_values)? * step_epsilon;
            }
            if let Some(expr_z) = expressions.get(2) {
                z += expr_z.evaluate(&var_values)? * step_epsilon;
            }
        }
    }

    Ok(result)
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
                "Sqrt" => Some(Box::new(Power::new(
                    operands[0].clone(),
                    Box::new(Constant::new(0.5)),
                ))),
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
