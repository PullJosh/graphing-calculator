use crate::ast::ASTNode;
use crate::expression::*;
use std::any::Any;
use std::collections::HashMap;

pub trait Set: ASTNode + std::fmt::Debug {
    fn contains(&self, variables: &HashMap<String, f64>) -> bool;
    fn basic_simplify(&self) -> Box<dyn Set>;

    fn clone_dyn(&self) -> Box<dyn Set>;
    fn as_any(&self) -> &dyn Any;
}

impl Clone for Box<dyn Set> {
    fn clone(&self) -> Self {
        self.clone_dyn()
    }
}

#[derive(Debug)]
pub struct EmptySet;
impl EmptySet {
    pub fn new() -> Self {
        EmptySet {}
    }
}
impl Set for EmptySet {
    fn contains(&self, _variables: &HashMap<String, f64>) -> bool {
        false
    }
    fn basic_simplify(&self) -> Box<dyn Set> {
        Box::new(EmptySet)
    }
    fn clone_dyn(&self) -> Box<dyn Set> {
        Box::new(EmptySet)
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl ASTNode for EmptySet {}

#[derive(Debug)]
pub struct FullSet;
impl FullSet {
    pub fn new() -> Self {
        FullSet {}
    }
}
impl Set for FullSet {
    fn contains(&self, _variables: &HashMap<String, f64>) -> bool {
        true
    }
    fn basic_simplify(&self) -> Box<dyn Set> {
        Box::new(FullSet)
    }
    fn clone_dyn(&self) -> Box<dyn Set> {
        Box::new(FullSet)
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl ASTNode for FullSet {}

#[derive(Clone, Debug)]
pub struct Union {
    sets: Vec<Box<dyn Set>>,
}
impl Union {
    pub fn new(sets: Vec<Box<dyn Set>>) -> Self {
        Union { sets }
    }
}
impl Set for Union {
    fn contains(&self, variables: &HashMap<String, f64>) -> bool {
        for set in &self.sets {
            if set.contains(variables) {
                return true;
            }
        }
        false
    }
    fn basic_simplify(&self) -> Box<dyn Set> {
        let mut sets = Vec::new();
        for set in &self.sets {
            let simplified = set.basic_simplify();
            if let Some(u) = simplified.as_any().downcast_ref::<Union>() {
                sets.extend(u.sets.clone());
            } else if let Some(_full) = simplified.as_any().downcast_ref::<FullSet>() {
                return Box::new(FullSet);
            } else if let Some(_empty) = simplified.as_any().downcast_ref::<EmptySet>() {
                continue;
            } else {
                sets.push(simplified);
            }
        }
        if sets.len() == 0 {
            Box::new(EmptySet)
        } else if sets.len() == 1 {
            sets.pop().unwrap()
        } else {
            Box::new(Union { sets })
        }
    }
    fn clone_dyn(&self) -> Box<dyn Set> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl ASTNode for Union {}

#[derive(Clone, Debug)]
pub struct Intersection {
    sets: Vec<Box<dyn Set>>,
}
impl Intersection {
    pub fn new(sets: Vec<Box<dyn Set>>) -> Self {
        Intersection { sets }
    }
}
impl Set for Intersection {
    fn contains(&self, variables: &HashMap<String, f64>) -> bool {
        for set in &self.sets {
            if !set.contains(variables) {
                return false;
            }
        }
        true
    }
    fn basic_simplify(&self) -> Box<dyn Set> {
        let mut sets = Vec::new();
        for set in &self.sets {
            let simplified = set.basic_simplify();
            if let Some(intersection) = simplified.as_any().downcast_ref::<Intersection>() {
                sets.extend(intersection.sets.clone());
            } else if let Some(_empty) = simplified.as_any().downcast_ref::<EmptySet>() {
                return Box::new(EmptySet);
            } else if let Some(_full) = simplified.as_any().downcast_ref::<FullSet>() {
                continue;
            } else {
                sets.push(simplified);
            }
        }
        if sets.len() == 0 {
            Box::new(FullSet)
        } else if sets.len() == 1 {
            sets.pop().unwrap()
        } else {
            Box::new(Intersection { sets })
        }
    }
    fn clone_dyn(&self) -> Box<dyn Set> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl ASTNode for Intersection {}

#[derive(Clone, Debug)]
pub enum ComparisonOperator {
    LessThan,
    LessThanOrEqual,
    Equal,
    GreaterThanOrEqual,
    GreaterThan,
    NotEqual,
}

#[derive(Clone, Debug)]
pub struct Equation {
    pub left: Box<dyn Expression>,
    pub right: Box<dyn Expression>,
    pub operator: ComparisonOperator,
}
impl Equation {
    pub fn new(
        left: Box<dyn Expression>,
        right: Box<dyn Expression>,
        operator: ComparisonOperator,
    ) -> Self {
        Equation {
            left,
            right,
            operator,
        }
    }
}
impl Set for Equation {
    fn contains(&self, variables: &HashMap<String, f64>) -> bool {
        let lhs = self.left.evaluate(variables);
        let rhs = self.right.evaluate(variables);

        match self.operator {
            ComparisonOperator::LessThan => lhs < rhs,
            ComparisonOperator::LessThanOrEqual => lhs <= rhs,
            ComparisonOperator::Equal => lhs == rhs,
            ComparisonOperator::GreaterThanOrEqual => lhs >= rhs,
            ComparisonOperator::GreaterThan => lhs > rhs,
            ComparisonOperator::NotEqual => lhs != rhs,
        }
    }
    fn basic_simplify(&self) -> Box<dyn Set> {
        let diff = Plus::new(vec![
            self.left.clone(),
            Box::new(Minus::new(self.right.clone())),
        ])
        .basic_simplify();

        if let Some(diff_value) = diff.constant_value() {
            let result = match self.operator {
                ComparisonOperator::LessThan => diff_value < 0.0,
                ComparisonOperator::LessThanOrEqual => diff_value <= 0.0,
                ComparisonOperator::Equal => diff_value == 0.0,
                ComparisonOperator::GreaterThanOrEqual => diff_value >= 0.0,
                ComparisonOperator::GreaterThan => diff_value > 0.0,
                ComparisonOperator::NotEqual => diff_value != 0.0,
            };
            if result {
                return Box::new(FullSet);
            } else {
                return Box::new(EmptySet);
            }
        }

        self.clone_dyn()
    }
    fn clone_dyn(&self) -> Box<dyn Set> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl ASTNode for Equation {}

#[derive(Clone, Debug)]
pub struct Interval {
    pub variable: String,
    pub lower: f64,
    pub upper: f64,
    pub lower_inclusive: bool,
    pub upper_inclusive: bool,
}
impl Set for Interval {
    fn contains(&self, variables: &HashMap<String, f64>) -> bool {
        let value = variables.get(&self.variable);
        let value = match value {
            Some(v) => *v,
            None => return false,
        };
        if self.lower_inclusive && self.upper_inclusive {
            self.lower <= value && value <= self.upper
        } else if self.lower_inclusive {
            self.lower <= value && value < self.upper
        } else if self.upper_inclusive {
            self.lower < value && value <= self.upper
        } else {
            self.lower < value && value < self.upper
        }
    }
    fn basic_simplify(&self) -> Box<dyn Set> {
        self.clone_dyn()
    }
    fn clone_dyn(&self) -> Box<dyn Set> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl ASTNode for Interval {}
