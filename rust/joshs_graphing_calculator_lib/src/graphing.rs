use wasm_bindgen::prelude::*;

use crate::equation::*;
use crate::expression::*;
use na::{OMatrix, U1, U2, U3};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::point::*;
use crate::segment::*;
use crate::vector::*;

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GraphBox {
    pub x_min: f64,
    pub x_max: f64,
    pub y_min: f64,
    pub y_max: f64,
}

impl GraphBox {
    pub fn new(x_min: f64, x_max: f64, y_min: f64, y_max: f64) -> Self {
        GraphBox {
            x_min,
            x_max,
            y_min,
            y_max,
        }
    }

    pub fn get_quadrant(&self, index: u64) -> GraphBox {
        let x_mid = (self.x_min + self.x_max) / 2.0;
        let y_mid = (self.y_min + self.y_max) / 2.0;
        match index {
            0 => GraphBox::new(self.x_min, x_mid, self.y_min, y_mid),
            1 => GraphBox::new(x_mid, self.x_max, self.y_min, y_mid),
            2 => GraphBox::new(self.x_min, x_mid, y_mid, self.y_max),
            3 => GraphBox::new(x_mid, self.x_max, y_mid, self.y_max),
            _ => panic!("Invalid quadrant index"),
        }
    }

    pub fn get_corner(&self, index: u64) -> (f64, f64) {
        match index {
            0 => (self.x_min, self.y_min),
            1 => (self.x_max, self.y_min),
            2 => (self.x_min, self.y_max),
            3 => (self.x_max, self.y_max),
            _ => panic!("Invalid corner index"),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum QuadTreeNode {
    Root(Box<QuadTreeRootNode>),
    Leaf(QuadTreeLeafNode),
    Zero,
    Negative,
    Positive,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QuadTreeRootNode {
    children: [QuadTreeNode; 4],
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QuadTreeLeafNode {
    edge_points: Vec<Point2D>,
    vertex: Point2D,
}

pub fn graph_equation_2d(
    var1: &str,
    var2: &str,
    window: &GraphBox,
    equation: &Equation,
    depth: i64,
    search_depth: i64,
) -> Result<Vec<Contour2D>, String> {
    if let Some(var) = equation.left.as_any().downcast_ref::<Variable>() {
        if var.name == var1 {
            if equation.right.count_var_instances(var1) == 0 {
                return graph_function_2d(var2, window, equation.right.clone(), true);
            }
        }
        if var.name == var2 {
            if equation.right.count_var_instances(var2) == 0 {
                return graph_function_2d(var1, window, equation.right.clone(), false);
            }
        }
    }
    if let Some(var) = equation.right.as_any().downcast_ref::<Variable>() {
        if var.name == var1 {
            if equation.left.count_var_instances(var1) == 0 {
                return graph_function_2d(var2, window, equation.left.clone(), true);
            }
        }
        if var.name == var2 {
            if equation.left.count_var_instances(var2) == 0 {
                return graph_function_2d(var1, window, equation.left.clone(), false);
            }
        }
    }

    let expression = Plus::new(vec![
        equation.left.clone(),
        Box::new(Minus::new(equation.right.clone())),
    ]);

    let variables = expression.get_variables();
    if variables.iter().any(|v| v != var1 && v != var2) {
        return Err(format!(
            "Cannot plot equation of variables [{}] on axes {} and {}",
            variables
                .iter()
                .map(|x| x.to_owned() + ",")
                .collect::<String>(),
            var1,
            var2
        ));
    }

    let f = |Point2D(x, y)| {
        let mut variables = HashMap::new();
        variables.insert(var1, x);
        variables.insert(var2, y);
        expression.evaluate(&variables).unwrap()
    };

    let dx = expression.derivative(var1).basic_simplify();
    let dy = expression.derivative(var2).basic_simplify();
    let df = |Point2D(x, y)| {
        let mut variables = HashMap::new();
        variables.insert(var1, x);
        variables.insert(var2, y);
        Vec2D(
            dx.evaluate(&variables).unwrap(),
            dy.evaluate(&variables).unwrap(),
        )
    };
    let df = get_cheating_gradient(&df);

    let tree = build_tree(depth, search_depth, window, &f, &df, var1, var2);

    Ok(get_contours_2d(&tree))
}

pub fn graph_function_2d(
    var: &str,
    window: &GraphBox,
    expression: Box<dyn Expression>,
    flipped: bool,
) -> Result<Vec<Contour2D>, String> {
    let mut contours = vec![];
    let mut contour: Contour2D = vec![];

    // log(format!(
    //     "Domain: {:?}",
    //     expression.get_real_domain().basic_simplify()
    // ));

    let mut variables = HashMap::new();
    use rand::Rng;
    let mut rng: rand::rngs::StdRng = rand::SeedableRng::seed_from_u64(0);
    for i in 0..501 {
        // In high-frequency graphs, taking regular samples can cause patterns to
        // appear that are not actually there. (For example, when graphing y = sin(x^2)
        // and zooming out.) To avoid this, we randomize the sample point slightly.
        let randomized_i = i as f64
            + if i == 0 || i == 500 {
                0.0
            } else {
                rng.gen::<f64>() - 0.5
            };
        let x = window.x_min + (window.x_max - window.x_min) * randomized_i / 500.0;
        variables.insert(var, x);

        let y = expression.evaluate(&variables)?;

        if y.is_finite() {
            if flipped {
                contour.push(Point2D(y, x));
            } else {
                contour.push(Point2D(x, y));
            }
        }
    }

    contours.push(contour);

    Ok(contours)
}

fn build_tree(
    depth: i64,
    search_depth: i64,
    area: &GraphBox,
    f: &impl Fn(Point2D) -> f64,
    df: &impl Fn(Point2D) -> Vec2D,
    var1: &str,
    var2: &str,
) -> QuadTreeNode {
    let vertex_values = [
        f(Point2D(area.x_min, area.y_min)),
        f(Point2D(area.x_max, area.y_min)),
        f(Point2D(area.x_min, area.y_max)),
        f(Point2D(area.x_max, area.y_max)),
    ];

    if search_depth <= 0 {
        // If we're below the search depth, check the vertex values
        // and stop if they look boring.
        if vertex_values.iter().all(|value| value == &0.0) {
            return QuadTreeNode::Zero;
        }
        if vertex_values.iter().all(|value| value < &0.0) {
            return QuadTreeNode::Negative;
        }
        if vertex_values.iter().all(|value| value >= &0.0) {
            return QuadTreeNode::Positive;
        }

        // If we reach this point, the node looks interesting. But if we've hit the bottom
        // of the tree, we have to stop anyway.
        if depth <= 0 {
            let (edge_points, vertex) = get_leaf_key_points(area, &f, &df);

            return QuadTreeNode::Leaf(QuadTreeLeafNode {
                edge_points,
                vertex,
            });
        }
    }

    // Either this node looks interesting or we haven't searched enough yet.
    // Let's make this a root node and keep going.
    let children = [
        build_tree(
            depth - 1,
            search_depth - 1,
            &area.get_quadrant(0),
            f,
            df,
            var1,
            var2,
        ),
        build_tree(
            depth - 1,
            search_depth - 1,
            &area.get_quadrant(1),
            f,
            df,
            var1,
            var2,
        ),
        build_tree(
            depth - 1,
            search_depth - 1,
            &area.get_quadrant(2),
            f,
            df,
            var1,
            var2,
        ),
        build_tree(
            depth - 1,
            search_depth - 1,
            &area.get_quadrant(3),
            f,
            df,
            var1,
            var2,
        ),
    ];

    // If the children are all boring, then we can collapse this into a boring node without consequence
    if children.iter().all(|child| match child {
        QuadTreeNode::Zero => true,
        _ => false,
    }) {
        return QuadTreeNode::Zero;
    }

    if children.iter().all(|child| match child {
        QuadTreeNode::Positive => true,
        _ => false,
    }) {
        return QuadTreeNode::Positive;
    }

    if children.iter().all(|child| match child {
        QuadTreeNode::Negative => true,
        _ => false,
    }) {
        return QuadTreeNode::Negative;
    }

    return QuadTreeNode::Root(Box::new(QuadTreeRootNode { children }));
}

pub fn get_cheating_gradient<'a>(
    df: &'a dyn Fn(Point2D) -> Vec2D,
) -> Box<dyn Fn(Point2D) -> Vec2D + 'a> {
    fn is_valid_result(result: &Vec2D) -> bool {
        result.0.is_finite() && result.1.is_finite()
    }

    Box::new(move |Point2D(x, y)| {
        let epsilon = 0.00001;
        let mut result = df(Point2D(x, y));
        if !is_valid_result(&result) {
            result = df(Point2D(x + epsilon, y + epsilon));
            if !is_valid_result(&result) {
                result = df(Point2D(x - epsilon, y - epsilon));
                if !is_valid_result(&result) {
                    result = df(Point2D(x + epsilon, y - epsilon));
                    if !is_valid_result(&result) {
                        result = df(Point2D(x - epsilon, y + epsilon));
                        if !is_valid_result(&result) {
                            result = df(Point2D(x + epsilon, y));
                            if !is_valid_result(&result) {
                                result = df(Point2D(x - epsilon, y));
                                if !is_valid_result(&result) {
                                    result = df(Point2D(x, y + epsilon));
                                    if !is_valid_result(&result) {
                                        result = df(Point2D(x, y - epsilon));
                                        if !is_valid_result(&result) {
                                            result = Vec2D(0.0, 0.0);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        result
    })
}

fn get_contours_2d(tree_node: &QuadTreeNode) -> Vec<Contour2D> {
    fn get_segments(tree_node: &QuadTreeNode) -> Vec<Segment2D> {
        match tree_node {
            QuadTreeNode::Root(root) => {
                let mut segments = vec![];
                for child in &root.children {
                    segments.append(&mut get_segments(child));
                }
                segments
            }
            QuadTreeNode::Leaf(leaf) => {
                let mut segments = vec![];
                for point in &leaf.edge_points {
                    segments.push(Segment2D(point.clone(), leaf.vertex.clone()));
                }
                segments
            }
            _ => vec![],
        }
    }

    let segments = get_segments(tree_node);
    let contours = segments_to_contours(&segments);
    contours
}

fn segments_to_contours(segments: &Vec<Segment2D>) -> Vec<Contour2D> {
    let mut contours: Vec<Contour2D> = vec![];
    for segment in segments {
        let mut done = false;
        for contour in &mut contours {
            if contour.last().unwrap() == &segment.0 {
                contour.push(segment.1.clone());
                done = true;
                break;
            } else if contour.first().unwrap() == &segment.1 {
                contour.insert(0, segment.0.clone());
                done = true;
                break;
            } else if contour.last().unwrap() == &segment.1 {
                contour.push(segment.0.clone());
                done = true;
                break;
            } else if contour.first().unwrap() == &segment.0 {
                contour.insert(0, segment.1.clone());
                done = true;
                break;
            }
        }
        if !done {
            contours.push(vec![segment.0.clone(), segment.1.clone()]);
        }
    }
    contours
}

pub fn get_leaf_key_points(
    area: &GraphBox,
    f: &dyn Fn(Point2D) -> f64,
    df: &dyn Fn(Point2D) -> Vec2D,
) -> (Vec<Point2D>, Point2D) {
    fn find_zero(start: f64, start_val: f64, end: f64, end_val: f64) -> f64 {
        let t = if start_val == end_val {
            0.5
        } else {
            -start_val / (end_val - start_val)
        };
        start + t * (end - start)
    }

    let corner_values = [
        f(Point2D(area.x_min, area.y_min)),
        f(Point2D(area.x_max, area.y_min)),
        f(Point2D(area.x_min, area.y_max)),
        f(Point2D(area.x_max, area.y_max)),
    ];

    let mut edge_points: Vec<Point2D> = vec![];
    if corner_values[0] == 0.0 {
        edge_points.push(Point2D(area.x_min, area.y_min));
    }
    if corner_values[1] == 0.0 {
        edge_points.push(Point2D(area.x_max, area.y_min));
    }
    if corner_values[2] == 0.0 {
        edge_points.push(Point2D(area.x_min, area.y_max));
    }
    if corner_values[3] == 0.0 {
        edge_points.push(Point2D(area.x_max, area.y_max));
    }
    if corner_values[0] * corner_values[1] < 0.0 {
        edge_points.push(Point2D(
            find_zero(area.x_min, corner_values[0], area.x_max, corner_values[1]),
            area.y_min,
        ));
    }
    if corner_values[0] * corner_values[2] < 0.0 {
        edge_points.push(Point2D(
            area.x_min,
            find_zero(area.y_min, corner_values[0], area.y_max, corner_values[2]),
        ));
    }
    if corner_values[1] * corner_values[3] < 0.0 {
        edge_points.push(Point2D(
            area.x_max,
            find_zero(area.y_min, corner_values[1], area.y_max, corner_values[3]),
        ));
    }
    if corner_values[2] * corner_values[3] < 0.0 {
        edge_points.push(Point2D(
            find_zero(area.x_min, corner_values[2], area.x_max, corner_values[3]),
            area.y_max,
        ));
    }

    if edge_points.len() == 0 {
        return (
            edge_points,
            Point2D(
                (area.x_min + area.x_max) / 2.0,
                (area.y_min + area.y_max) / 2.0,
            ),
        );
    }

    let mut mean_point = Point2D(0.0, 0.0);
    for p in &edge_points {
        mean_point += *p;
    }
    mean_point.0 /= edge_points.len() as f64;
    mean_point.1 /= edge_points.len() as f64;

    let normals = edge_points
        .iter()
        .map(|p| df(p.clone()).normalize())
        .collect::<Vec<_>>();

    let mut mat_a_t_a = OMatrix::<f64, U2, U2>::zeros();
    for &normal in &normals {
        mat_a_t_a[(0, 0)] += normal.0 * normal.0;
        mat_a_t_a[(0, 1)] += normal.0 * normal.1;
        mat_a_t_a[(1, 0)] += normal.1 * normal.0;
        mat_a_t_a[(1, 1)] += normal.1 * normal.1;
    }

    let mut mat_a_t_b = OMatrix::<f64, U2, U1>::zeros();
    for i in 0..normals.len() {
        let dot = normals[i].0 * (edge_points[i].0 - mean_point.0)
            + normals[i].1 * (edge_points[i].1 - mean_point.1);
        mat_a_t_b[(0, 0)] += dot * normals[i].0;
        mat_a_t_b[(1, 0)] += dot * normals[i].1;
    }

    fn solve_2(
        mat_a_t_a: &OMatrix<f64, U2, U2>,
        mat_a_t_b: &OMatrix<f64, U2, U1>,
        mean_point: &Point2D,
    ) -> Point2D {
        let mat_a_t_a_inv = mat_a_t_a.pseudo_inverse(0.0000001);
        match mat_a_t_a_inv {
            Ok(mat_a_t_a_inv) => {
                let mat_a_t_a_inv_b = &mat_a_t_a_inv * mat_a_t_b;
                Point2D(
                    mat_a_t_a_inv_b[(0, 0)] + mean_point.0,
                    mat_a_t_a_inv_b[(1, 0)] + mean_point.1,
                )
            }
            Err(_) => mean_point.clone(),
        }
    }

    let point = solve_2(&mat_a_t_a, &mat_a_t_b, &mean_point);

    if point.0 >= area.x_min
        && point.0 <= area.x_max
        && point.1 >= area.y_min
        && point.1 <= area.y_max
    {
        return (edge_points, point);
    }

    fn constrain(
        mat_a_t_a: &OMatrix<f64, U2, U2>,
        mat_a_t_b: &OMatrix<f64, U2, U1>,
        axis: usize,
        value: f64,
    ) -> (OMatrix<f64, U3, U3>, OMatrix<f64, U3, U1>) {
        let mut new_mat_a_t_a = mat_a_t_a.insert_column(2, 0.0).insert_row(2, 0.0);
        new_mat_a_t_a[(2, axis)] = 1.0;
        new_mat_a_t_a[(axis, 2)] = 1.0;

        let new_mat_a_t_b = mat_a_t_b.insert_row(2, value);
        (new_mat_a_t_a, new_mat_a_t_b)
    }

    fn solve_3(
        (mat_a_t_a, mat_a_t_b): (OMatrix<f64, U3, U3>, OMatrix<f64, U3, U1>),
        mean_point: &Point2D,
    ) -> Point2D {
        let mat_a_t_a_inv = mat_a_t_a.pseudo_inverse(0.0000001);
        match mat_a_t_a_inv {
            Ok(mat_a_t_a_inv) => {
                let mat_a_t_a_inv_b = &mat_a_t_a_inv * mat_a_t_b;
                Point2D(
                    mat_a_t_a_inv_b[(0, 0)] + mean_point.0,
                    mat_a_t_a_inv_b[(1, 0)] + mean_point.1,
                )
            }
            Err(_) => mean_point.clone(),
        }
    }

    let solutions = [
        solve_3(
            constrain(&mat_a_t_a, &mat_a_t_b, 0, area.x_min - mean_point.0),
            &mean_point,
        ),
        solve_3(
            constrain(&mat_a_t_a, &mat_a_t_b, 0, area.x_max - mean_point.0),
            &mean_point,
        ),
        solve_3(
            constrain(&mat_a_t_a, &mat_a_t_b, 1, area.y_min - mean_point.1),
            &mean_point,
        ),
        solve_3(
            constrain(&mat_a_t_a, &mat_a_t_b, 1, area.y_max - mean_point.1),
            &mean_point,
        ),
    ];

    let valid_solutions: Vec<_> = solutions
        .iter()
        .enumerate()
        .filter(|(i, pt)| {
            if i <= &1 {
                pt.1 >= area.y_min && pt.1 <= area.y_max
            } else {
                pt.0 >= area.x_min && pt.0 <= area.x_max
            }
        })
        .map(|(_, pt)| pt)
        .collect();

    fn get_solution_error(solution: &Point2D, normals: &[Vec2D], edge_points: &[Point2D]) -> f64 {
        let mut error = 0.0;
        for i in 0..normals.len() {
            error += normals[i]
                .dot(&(edge_points[i] - *solution).to_vec())
                .powi(2);
        }
        error
    }
    fn get_best_solution(
        solutions: &Vec<&Point2D>,
        normals: &[Vec2D],
        edge_points: &[Point2D],
    ) -> Point2D {
        let mut best_solution = solutions[0];
        let mut best_error = get_solution_error(best_solution, &normals, &edge_points);
        for solution in solutions.iter().skip(1) {
            let error = get_solution_error(solution, &normals, &edge_points);
            if error < best_error {
                best_solution = solution;
                best_error = error;
            }
        }
        best_solution.to_owned()
    }

    if valid_solutions.len() > 0 {
        let point = get_best_solution(&valid_solutions, &normals, &edge_points);
        return (edge_points, point);
    }

    (edge_points, Point2D(area.x_min, area.y_min))
}
