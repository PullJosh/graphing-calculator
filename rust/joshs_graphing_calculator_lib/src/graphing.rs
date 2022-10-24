use crate::equation::*;
use crate::expression::*;
use na::{OMatrix, U1, U2, U3};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Contour {
    points: Vec<(f64, f64)>,
}

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
    edge_points: Vec<(f64, f64)>,
    vertex: (f64, f64),
}

#[derive(Serialize, Deserialize, Clone)]
pub struct GraphedEquation {
    pub graph_box: GraphBox,
    pub quad_tree: QuadTreeNode,
    pub contours: Vec<Contour>,
}

impl QuadTreeNode {
    // Right now `deepen` returns an entire new tree (immutable), which is wasteful.
    // We should be mutating the existing tree instead.
    fn deepen(&self) -> QuadTreeNode {
        match self {
            QuadTreeNode::Root(root) => QuadTreeNode::Root(Box::new(QuadTreeRootNode {
                children: [
                    root.children[0].deepen(),
                    root.children[1].deepen(),
                    root.children[2].deepen(),
                    root.children[3].deepen(),
                ],
            })),
            QuadTreeNode::Leaf(leaf) => {
                let children = [
                    QuadTreeNode::Leaf(QuadTreeLeafNode {
                        edge_points: Vec::new(),
                        vertex: leaf.vertex,
                    }),
                    QuadTreeNode::Leaf(QuadTreeLeafNode {
                        edge_points: Vec::new(),
                        vertex: leaf.vertex,
                    }),
                    QuadTreeNode::Leaf(QuadTreeLeafNode {
                        edge_points: Vec::new(),
                        vertex: leaf.vertex,
                    }),
                    QuadTreeNode::Leaf(QuadTreeLeafNode {
                        edge_points: Vec::new(),
                        vertex: leaf.vertex,
                    }),
                ];

                return QuadTreeNode::Root(Box::new(QuadTreeRootNode { children }));
            }
            _ => self.clone(),
        }
    }
}

impl GraphedEquation {
    pub fn deepen(&mut self) {
        self.quad_tree = self.quad_tree.deepen();
        self.contours = get_combined_contours(&self.quad_tree);
    }
}

pub fn graph_equation_2d(
    var1: &str,
    var2: &str,
    window: &GraphBox,
    equation: &Equation,
    depth: i64,
    search_depth: i64,
) -> GraphedEquation {
    let expression = Plus::new(vec![
        equation.left.clone(),
        Box::new(Minus::new(equation.right.clone())),
    ]);

    let f = |x: f64, y: f64| {
        let mut variables = HashMap::new();
        variables.insert(var1, x);
        variables.insert(var2, y);
        expression.evaluate(&variables)
    };

    let dx = expression.derivative(var1).basic_simplify();
    let dy = expression.derivative(var2).basic_simplify();
    let df = |x: f64, y: f64| {
        let mut variables = HashMap::new();
        variables.insert(var1, x);
        variables.insert(var2, y);
        (dx.evaluate(&variables), dy.evaluate(&variables))
    };
    let df = get_cheating_gradient(&df);

    let tree = build_tree(depth, search_depth, window, &f, &df, var1, var2);

    let combined_contours = get_combined_contours(&tree);

    GraphedEquation {
        graph_box: window.clone(),
        quad_tree: tree,
        contours: combined_contours,
    }
}

fn build_tree(
    depth: i64,
    search_depth: i64,
    area: &GraphBox,
    f: &impl Fn(f64, f64) -> f64,
    df: &impl Fn(f64, f64) -> (f64, f64),
    var1: &str,
    var2: &str,
) -> QuadTreeNode {
    let vertex_values = [
        f(area.x_min, area.y_min),
        f(area.x_max, area.y_min),
        f(area.x_min, area.y_max),
        f(area.x_max, area.y_max),
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
    df: &'a dyn Fn(f64, f64) -> (f64, f64),
) -> Box<dyn Fn(f64, f64) -> (f64, f64) + 'a> {
    fn is_valid_result(result: &(f64, f64)) -> bool {
        result.0.is_finite() && result.1.is_finite()
    }

    Box::new(move |x: f64, y: f64| {
        let epsilon = 0.00001;
        let mut result = df(x, y);
        if !is_valid_result(&result) {
            result = df(x + epsilon, y + epsilon);
            if !is_valid_result(&result) {
                result = df(x - epsilon, y - epsilon);
                if !is_valid_result(&result) {
                    result = df(x + epsilon, y - epsilon);
                    if !is_valid_result(&result) {
                        result = df(x - epsilon, y + epsilon);
                        if !is_valid_result(&result) {
                            result = df(x + epsilon, y);
                            if !is_valid_result(&result) {
                                result = df(x - epsilon, y);
                                if !is_valid_result(&result) {
                                    result = df(x, y + epsilon);
                                    if !is_valid_result(&result) {
                                        result = df(x, y - epsilon);
                                        if !is_valid_result(&result) {
                                            result = (0.0, 0.0);
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

// fn get_leaf_connections(tree_node: &QuadTreeNode) -> Vec<(QuadTreeLeafNode, QuadTreeLeafNode)> {
//     fn get_vertical_connections(
//         top_node: &QuadTreeNode,
//         bottom_node: &QuadTreeNode,
//     ) -> Vec<(QuadTreeLeafNode, QuadTreeLeafNode)> {
//         match (top_node, bottom_node) {
//             (QuadTreeNode::Root(top), QuadTreeNode::Root(bottom)) => {
//                 let mut connections = vec![];
//                 connections.append(&mut get_vertical_connections(
//                     &top.children[0],
//                     &bottom.children[2],
//                 ));
//                 connections.append(&mut get_vertical_connections(
//                     &top.children[1],
//                     &bottom.children[3],
//                 ));
//                 connections
//             }
//             (QuadTreeNode::Root(top), bottom) => {
//                 let mut connections = vec![];
//                 connections.append(&mut get_vertical_connections(&top.children[0], bottom));
//                 connections.append(&mut get_vertical_connections(&top.children[1], bottom));
//                 connections
//             }
//             (top, QuadTreeNode::Root(bottom)) => {
//                 let mut connections = vec![];
//                 connections.append(&mut get_vertical_connections(top, &bottom.children[2]));
//                 connections.append(&mut get_vertical_connections(top, &bottom.children[3]));
//                 connections
//             }
//             (QuadTreeNode::Leaf(top), QuadTreeNode::Leaf(bottom)) => {
//                 vec![(top.clone(), bottom.clone())]
//             }
//             _ => vec![],
//         }
//     }

//     fn get_horizontal_connections(
//         left_node: &QuadTreeNode,
//         right_node: &QuadTreeNode,
//     ) -> Vec<(QuadTreeLeafNode, QuadTreeLeafNode)> {
//         match (left_node, right_node) {
//             (QuadTreeNode::Root(left), QuadTreeNode::Root(right)) => {
//                 let mut connections = vec![];
//                 connections.append(&mut get_horizontal_connections(
//                     &left.children[1],
//                     &right.children[0],
//                 ));
//                 connections.append(&mut get_horizontal_connections(
//                     &left.children[3],
//                     &right.children[2],
//                 ));
//                 connections
//             }
//             (QuadTreeNode::Root(left), right) => {
//                 let mut connections = vec![];
//                 connections.append(&mut get_horizontal_connections(&left.children[1], right));
//                 connections.append(&mut get_horizontal_connections(&left.children[3], right));
//                 connections
//             }
//             (left, QuadTreeNode::Root(right)) => {
//                 let mut connections = vec![];
//                 connections.append(&mut get_horizontal_connections(left, &right.children[0]));
//                 connections.append(&mut get_horizontal_connections(left, &right.children[2]));
//                 connections
//             }
//             (QuadTreeNode::Leaf(left), QuadTreeNode::Leaf(right)) => {
//                 vec![(left.clone(), right.clone())]
//             }
//             _ => vec![],
//         }
//     }

//     fn get_face_connections(tree_node: &QuadTreeNode) -> Vec<(QuadTreeLeafNode, QuadTreeLeafNode)> {
//         match tree_node {
//             QuadTreeNode::Root(root) => {
//                 let mut connections = vec![];
//                 for child in &root.children {
//                     connections.append(&mut get_face_connections(child));
//                 }
//                 connections.append(&mut get_vertical_connections(
//                     &root.children[2],
//                     &root.children[0],
//                 ));
//                 connections.append(&mut get_vertical_connections(
//                     &root.children[3],
//                     &root.children[1],
//                 ));
//                 connections.append(&mut get_horizontal_connections(
//                     &root.children[0],
//                     &root.children[1],
//                 ));
//                 connections.append(&mut get_horizontal_connections(
//                     &root.children[2],
//                     &root.children[3],
//                 ));
//                 connections
//             }
//             _ => vec![],
//         }
//     }

//     get_face_connections(tree_node)
// }

fn get_combined_contours(tree_node: &QuadTreeNode) -> Vec<Contour> {
    fn get_contours(tree_node: &QuadTreeNode) -> Vec<Contour> {
        match tree_node {
            QuadTreeNode::Root(root) => {
                let mut contours = vec![];
                for child in &root.children {
                    contours.append(&mut get_contours(child));
                }
                contours
            }
            QuadTreeNode::Leaf(leaf) => {
                let mut contours = vec![];
                for point in &leaf.edge_points {
                    contours.push(Contour {
                        points: vec![point.clone(), leaf.vertex.clone()],
                    });
                }
                contours
            }
            _ => vec![],
        }
    }

    simplify_contours(&get_contours(tree_node))
}

// fn get_dual_contours(leaf_connections: &Vec<(QuadTreeLeafNode, QuadTreeLeafNode)>) -> Vec<Contour> {
//     let mut contours = vec![];
//     for (leaf1, leaf2) in leaf_connections {
//         let mut contour = Contour::new();
//         contour.add_point(leaf1.vertex);
//         contour.add_point(leaf2.vertex);
//         contours.push(contour);
//     }
//     // simplify_contours(&contours)
//     contours
// }

// fn simplify_contours(contours: &Vec<Contour>) -> Vec<Contour> {
//     let mut simplified_contours = vec![];
//     for contour in contours {}
// }

fn simplify_contours(contours: &Vec<Contour>) -> Vec<Contour> {
    let mut simplified_contours = contours.clone();

    for (i, contour) in simplified_contours.iter().enumerate() {
        for (j, other_contour) in simplified_contours.iter().enumerate() {
            if i == j {
                continue;
            }
            let mut merged_contour: Option<Contour> = None;
            if contour.points[0] == other_contour.points[0] {
                let mut new_points = contour.points.clone();
                new_points.remove(0);
                new_points.reverse();
                new_points.append(&mut other_contour.points.clone());
                merged_contour = Some(Contour { points: new_points });
            }
            if contour.points[contour.points.len() - 1] == other_contour.points[0] {
                let mut new_points = contour.points.clone();
                new_points.remove(new_points.len() - 1);
                new_points.append(&mut other_contour.points.clone());
                merged_contour = Some(Contour { points: new_points });
            }
            if contour.points[contour.points.len() - 1]
                == other_contour.points[other_contour.points.len() - 1]
            {
                let mut new_points = contour.points.clone();
                new_points.remove(new_points.len() - 1);
                let mut new_points_2 = other_contour.points.clone();
                new_points_2.reverse();
                new_points.append(&mut new_points_2);
                merged_contour = Some(Contour { points: new_points });
            }

            if let Some(merged_contour) = merged_contour {
                // Remove i and j. Remove the larger index first so that the
                // smaller index remains correct (elements not shifted)
                simplified_contours.remove(i.max(j));
                simplified_contours.remove(i.min(j));

                simplified_contours.push(merged_contour);
                return simplify_contours(&simplified_contours);
            }
        }
    }
    simplified_contours
}

pub fn get_leaf_key_points(
    area: &GraphBox,
    f: &dyn Fn(f64, f64) -> f64,
    df: &dyn Fn(f64, f64) -> (f64, f64),
) -> (Vec<(f64, f64)>, (f64, f64)) {
    fn find_zero(start: f64, start_val: f64, end: f64, end_val: f64) -> f64 {
        let t = if start_val == end_val {
            0.5
        } else {
            -start_val / (end_val - start_val)
        };
        start + t * (end - start)
    }

    let corner_values = [
        f(area.x_min, area.y_min),
        f(area.x_max, area.y_min),
        f(area.x_min, area.y_max),
        f(area.x_max, area.y_max),
    ];

    let mut edge_points: Vec<(f64, f64)> = vec![];
    if corner_values[0] == 0.0 {
        edge_points.push((area.x_min, area.y_min));
    }
    if corner_values[1] == 0.0 {
        edge_points.push((area.x_max, area.y_min));
    }
    if corner_values[2] == 0.0 {
        edge_points.push((area.x_min, area.y_max));
    }
    if corner_values[3] == 0.0 {
        edge_points.push((area.x_max, area.y_max));
    }
    if corner_values[0] * corner_values[1] < 0.0 {
        edge_points.push((
            find_zero(area.x_min, corner_values[0], area.x_max, corner_values[1]),
            area.y_min,
        ));
    }
    if corner_values[0] * corner_values[2] < 0.0 {
        edge_points.push((
            area.x_min,
            find_zero(area.y_min, corner_values[0], area.y_max, corner_values[2]),
        ));
    }
    if corner_values[1] * corner_values[3] < 0.0 {
        edge_points.push((
            area.x_max,
            find_zero(area.y_min, corner_values[1], area.y_max, corner_values[3]),
        ));
    }
    if corner_values[2] * corner_values[3] < 0.0 {
        edge_points.push((
            find_zero(area.x_min, corner_values[2], area.x_max, corner_values[3]),
            area.y_max,
        ));
    }

    if edge_points.len() == 0 {
        return (
            edge_points,
            (
                (area.x_min + area.x_max) / 2.0,
                (area.y_min + area.y_max) / 2.0,
            ),
        );
    }

    let mut mean_point = (0.0, 0.0);
    for p in &edge_points {
        mean_point.0 += p.0;
        mean_point.1 += p.1;
    }
    mean_point.0 /= edge_points.len() as f64;
    mean_point.1 /= edge_points.len() as f64;

    fn normalize(v: (f64, f64)) -> (f64, f64) {
        let mut len = (v.0 * v.0 + v.1 * v.1).sqrt();
        if len == 0.0 {
            len = 1.0
        }
        (v.0 / len, v.1 / len)
    }

    let normals = edge_points
        .iter()
        .map(|p| normalize(df(p.0, p.1)))
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
        mean_point: &(f64, f64),
    ) -> (f64, f64) {
        let mat_a_t_a_inv = mat_a_t_a.pseudo_inverse(0.0000001);
        match mat_a_t_a_inv {
            Ok(mat_a_t_a_inv) => {
                let mat_a_t_a_inv_b = &mat_a_t_a_inv * mat_a_t_b;
                (
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
        mean_point: &(f64, f64),
    ) -> (f64, f64) {
        let mat_a_t_a_inv = mat_a_t_a.pseudo_inverse(0.0000001);
        match mat_a_t_a_inv {
            Ok(mat_a_t_a_inv) => {
                let mat_a_t_a_inv_b = &mat_a_t_a_inv * mat_a_t_b;
                (
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

    fn get_solution_error(
        solution: &(f64, f64),
        normals: &[(f64, f64)],
        edge_points: &[(f64, f64)],
    ) -> f64 {
        let mut error = 0.0;
        for i in 0..normals.len() {
            error += (normals[i].0 * (edge_points[i].0 - solution.0)
                + normals[i].1 * (edge_points[i].1 - solution.1))
                .powi(2);
        }
        error
    }
    fn get_best_solution(
        solutions: &Vec<&(f64, f64)>,
        normals: &[(f64, f64)],
        edge_points: &[(f64, f64)],
    ) -> (f64, f64) {
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

    (edge_points, (area.x_min, area.y_min))
}
