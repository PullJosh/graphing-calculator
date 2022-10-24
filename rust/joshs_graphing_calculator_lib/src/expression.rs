use crate::ast::ASTNode;
use crate::equation::*;
use num::rational::Ratio;
use num::Integer;
use std::any::Any;
use std::collections::HashMap;

pub trait Expression: ASTNode + std::fmt::Display + std::fmt::Debug {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64;
    fn derivative(&self, variable: &str) -> Box<dyn Expression>;
    fn get_real_domain(&self) -> Box<dyn Set>;
    fn basic_simplify(&self) -> Box<dyn Expression>;
    fn is_constant(&self) -> bool;

    fn clone_dyn(&self) -> Box<dyn Expression>;
    fn as_any(&self) -> &dyn Any;
}

impl Clone for Box<dyn Expression> {
    fn clone(&self) -> Self {
        self.clone_dyn()
    }
}

#[derive(Clone)]
pub struct Constant {
    value: f64,
}
impl Constant {
    pub fn new(value: f64) -> Self {
        Constant { value }
    }
}
impl Expression for Constant {
    fn evaluate(&self, _values: &HashMap<&str, f64>) -> f64 {
        self.value
    }
    fn derivative(&self, _variable: &str) -> Box<dyn Expression> {
        Box::new(Constant::new(0.0))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        Box::new(FullSet::new())
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        self.clone_dyn()
    }
    fn is_constant(&self) -> bool {
        true
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Constant {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}
impl std::fmt::Debug for Constant {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}
impl ASTNode for Constant {}

#[derive(Clone)]
pub struct Variable {
    pub name: String,
}
impl Variable {
    pub fn new(name: String) -> Self {
        Variable { name }
    }
}
impl Expression for Variable {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        values.get(&self.name.as_str()).unwrap().clone()
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        if self.name == variable {
            Box::new(Constant::new(1.0))
        } else {
            Box::new(Constant::new(0.0))
        }
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        Box::new(FullSet::new())
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        self.clone_dyn()
    }
    fn is_constant(&self) -> bool {
        false
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Variable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}
impl std::fmt::Debug for Variable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}
impl ASTNode for Variable {}

#[derive(Clone)]
pub struct Plus {
    terms: Vec<Box<dyn Expression>>,
}
impl Plus {
    pub fn new(terms: Vec<Box<dyn Expression>>) -> Self {
        Plus { terms }
    }
}
impl Expression for Plus {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        self.terms.iter().map(|term| term.evaluate(values)).sum()
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        Box::new(Plus {
            terms: self
                .terms
                .iter()
                .map(|term| term.derivative(variable))
                .collect(),
        })
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        Box::new(Union::new(
            self.terms
                .iter()
                .map(|term| term.get_real_domain())
                .collect(),
        ))
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let mut flattened_terms = Vec::new();
        for term in self.terms.iter() {
            if let Some(plus) = term.as_any().downcast_ref::<Plus>() {
                for subterm in plus.terms.iter() {
                    flattened_terms.push(subterm.clone());
                }
            } else {
                flattened_terms.push(term.clone());
            }
        }

        let mut terms = Vec::new();
        let mut constant = 0.0;
        for term in flattened_terms.iter() {
            let simplified = term.basic_simplify();
            if simplified.is_constant() {
                constant += simplified.evaluate(&HashMap::new());
            } else {
                terms.push(simplified);
            }
        }
        if constant != 0.0 {
            terms.push(Box::new(Constant::new(constant)));
        }
        if terms.len() == 0 {
            Box::new(Constant::new(0.0))
        } else if terms.len() == 1 {
            terms[0].clone()
        } else {
            Box::new(Plus { terms })
        }
    }
    fn is_constant(&self) -> bool {
        self.terms.iter().all(|term| term.is_constant())
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Plus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut first = true;
        for term in &self.terms {
            if first {
                first = false;
            } else {
                write!(f, " + ")?;
            }
            write!(f, "({})", term)?;
        }
        Ok(())
    }
}
impl std::fmt::Debug for Plus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut first = true;
        for term in &self.terms {
            if first {
                first = false;
            } else {
                write!(f, " + ")?;
            }
            write!(f, "({})", term)?;
        }
        Ok(())
    }
}
impl ASTNode for Plus {}

#[derive(Clone)]
pub struct Minus {
    value: Box<dyn Expression>,
}
impl Minus {
    pub fn new(value: Box<dyn Expression>) -> Self {
        Minus { value }
    }
}
impl Expression for Minus {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        -self.value.evaluate(values)
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        Box::new(Minus {
            value: self.value.derivative(variable),
        })
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        self.value.get_real_domain()
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let simplified = self.value.basic_simplify();
        if simplified.is_constant() {
            Box::new(Constant::new(-simplified.evaluate(&HashMap::new())))
        } else {
            Box::new(Minus::new(simplified))
        }
    }
    fn is_constant(&self) -> bool {
        self.value.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Minus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "-{}", self.value)
    }
}
impl std::fmt::Debug for Minus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "-{}", self.value)
    }
}
impl ASTNode for Minus {}

#[derive(Clone)]
pub struct Times {
    factors: Vec<Box<dyn Expression>>,
}
impl Times {
    pub fn new(factors: Vec<Box<dyn Expression>>) -> Self {
        Times { factors }
    }
}
impl Expression for Times {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        self.factors
            .iter()
            .map(|factor| factor.evaluate(values))
            .product()
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        Box::new(Plus::new(
            self.factors
                .iter()
                .enumerate()
                .map(|(i, _factor)| {
                    Box::new(Times::new(
                        self.factors
                            .iter()
                            .enumerate()
                            .map(|(j, other_factor)| {
                                if i == j {
                                    other_factor.derivative(variable)
                                } else {
                                    (*other_factor).clone()
                                }
                            })
                            .collect(),
                    )) as Box<dyn Expression>
                })
                .collect(),
        ))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        Box::new(Intersection::new(
            self.factors
                .iter()
                .map(|factor| factor.get_real_domain())
                .collect(),
        ))
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let mut flattened_factors = Vec::new();
        for factor in self.factors.iter() {
            if let Some(times) = factor.as_any().downcast_ref::<Times>() {
                for subfactor in times.factors.iter() {
                    flattened_factors.push(subfactor.clone());
                }
            } else {
                flattened_factors.push(factor.clone());
            }
        }

        let mut factors = Vec::new();
        let mut constant = 1.0;
        for factor in flattened_factors.iter() {
            let simplified = factor.basic_simplify();
            if simplified.is_constant() {
                constant *= simplified.evaluate(&HashMap::new());
            } else {
                factors.push(simplified);
            }
        }
        if constant == 0.0 {
            return Box::new(Constant::new(0.0));
        }
        if constant != 1.0 {
            factors.push(Box::new(Constant::new(constant)));
        }
        if factors.len() == 0 {
            Box::new(Constant::new(1.0))
        } else if factors.len() == 1 {
            factors[0].clone()
        } else {
            Box::new(Times { factors })
        }
    }
    fn is_constant(&self) -> bool {
        self.factors.iter().all(|factor| factor.is_constant())
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Times {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut first = true;
        for factor in &self.factors {
            if first {
                first = false;
            } else {
                write!(f, " * ")?;
            }
            write!(f, "({})", factor)?;
        }
        Ok(())
    }
}
impl std::fmt::Debug for Times {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut first = true;
        for factor in &self.factors {
            if first {
                first = false;
            } else {
                write!(f, " * ")?;
            }
            write!(f, "({})", factor)?;
        }
        Ok(())
    }
}
impl ASTNode for Times {}

#[derive(Clone)]
pub struct Inverse {
    value: Box<dyn Expression>,
}
impl Inverse {
    pub fn new(value: Box<dyn Expression>) -> Self {
        Inverse { value }
    }
}
impl Expression for Inverse {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        1.0 / self.value.evaluate(values)
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        Box::new(Minus::new(Box::new(Times::new(vec![
            Box::new(Power::new(
                self.value.clone(),
                Box::new(Constant::new(-2.0)),
            )),
            self.value.derivative(variable),
        ]))))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        Box::new(Intersection::new(vec![
            self.value.get_real_domain(),
            Box::new(Equation::new(
                self.value.clone(),
                Box::new(Constant::new(0.0)),
                ComparisonOperator::NotEqual,
            )),
        ]))
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let simplified = self.value.basic_simplify();
        if simplified.is_constant() {
            Box::new(Constant::new(1.0 / simplified.evaluate(&HashMap::new())))
        } else {
            Box::new(Inverse::new(simplified))
        }
    }
    fn is_constant(&self) -> bool {
        self.value.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Inverse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "1/{}", self.value)
    }
}
impl std::fmt::Debug for Inverse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "1/{}", self.value)
    }
}
impl ASTNode for Inverse {}

#[derive(Clone)]
pub struct Power {
    base: Box<dyn Expression>,
    exponent: Box<dyn Expression>,
}
impl Power {
    pub fn new(base: Box<dyn Expression>, exponent: Box<dyn Expression>) -> Self {
        Power { base, exponent }
    }
}
impl Expression for Power {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        let base = self.base.evaluate(values);
        let exponent = self.exponent.evaluate(values);
        base.powf(exponent)
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        // d/dx(f(x)^g(x)) = f(x)^(g(x) - 1) (g(x) f'(x) + f(x) log(f(x)) g'(x))
        let f = &self.base;
        let g = &self.exponent;
        Box::new(Times::new(vec![
            Box::new(Power::new(
                f.clone(),
                Box::new(Plus::new(vec![g.clone(), Box::new(Constant::new(-1.0))])),
            )),
            Box::new(Plus::new(vec![
                Box::new(Times::new(vec![g.clone(), f.derivative(variable)])),
                Box::new(Times::new(vec![
                    f.clone(),
                    Box::new(Log::new(std::f64::consts::E, f.clone())),
                    g.derivative(variable),
                ])),
            ])),
        ]))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        if self.exponent.is_constant() {
            let exp_value = self.exponent.evaluate(&HashMap::new());
            let exp_ratio = Ratio::from_float(exp_value);
            if exp_ratio.unwrap().denom().is_even() {
                // If the exponent has an even demonimator, then the base must be positive.
                return Box::new(Intersection::new(vec![
                    Box::new(Equation::new(
                        self.base.clone(),
                        Box::new(Constant::new(0.0)),
                        ComparisonOperator::GreaterThanOrEqual,
                    )),
                    self.base.get_real_domain(),
                ]));
            } else {
                // If the exponent has an odd demonimator, then the base can be positive or negative.
                if exp_value < 0.0 {
                    // If the exponent is negative, the base cannot be 0.
                    return Box::new(Intersection::new(vec![
                        Box::new(Equation::new(
                            self.base.clone(),
                            Box::new(Constant::new(0.0)),
                            ComparisonOperator::NotEqual,
                        )),
                        self.base.get_real_domain(),
                    ]));
                } else {
                    // If the exponent is positive, the base can be 0.
                    return self.base.get_real_domain();
                }
            }
        }

        Box::new(Intersection::new(vec![
            Box::new(Union::new(vec![
                // A positive base is defined everywhere
                Box::new(Equation::new(
                    self.base.clone(),
                    Box::new(Constant::new(0.0)),
                    ComparisonOperator::GreaterThan,
                )),
                // A base of 0 is defined only when the exponent is positive
                Box::new(Intersection::new(vec![
                    Box::new(Equation::new(
                        self.base.clone(),
                        Box::new(Constant::new(0.0)),
                        ComparisonOperator::Equal,
                    )),
                    Box::new(Equation::new(
                        self.exponent.clone(),
                        Box::new(Constant::new(0.0)),
                        ComparisonOperator::GreaterThan,
                    )),
                ])),
                // A negative base is never defined
            ])),
            self.base.get_real_domain(),
            self.exponent.get_real_domain(),
        ]))
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let base = self.base.basic_simplify();
        let exponent = self.exponent.basic_simplify();
        if base.is_constant() && exponent.is_constant() {
            Box::new(Constant::new(self.evaluate(&HashMap::new())))
        } else if exponent.is_constant() {
            let exponent = exponent.evaluate(&HashMap::new());
            if exponent == 0.0 {
                Box::new(Constant::new(1.0))
            } else if exponent == 1.0 {
                base
            } else if exponent == -1.0 {
                Box::new(Inverse::new(base))
            } else {
                Box::new(Power::new(base, Box::new(Constant::new(exponent))))
            }
        } else {
            Box::new(Power::new(base, exponent))
        }
    }
    fn is_constant(&self) -> bool {
        self.base.is_constant() && self.exponent.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Power {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({})^({})", self.base, self.exponent)
    }
}
impl std::fmt::Debug for Power {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({})^({})", self.base, self.exponent)
    }
}
impl ASTNode for Power {}

#[derive(Clone)]
pub struct Log {
    base: f64,
    value: Box<dyn Expression>,
}
impl Log {
    pub fn new(base: f64, value: Box<dyn Expression>) -> Self {
        Log { base, value }
    }
}
impl Expression for Log {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        let base = self.base;
        let value = self.value.evaluate(values);
        value.log(base)
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        // d/dx(log(b, f(x))) = (f'(x))/(log(b) f(x))
        Box::new(Times::new(vec![
            self.value.derivative(variable),
            Box::new(Power::new(
                Box::new(Times::new(vec![
                    Box::new(Log::new(
                        std::f64::consts::E,
                        Box::new(Constant::new(self.base)),
                    )),
                    self.value.clone(),
                ])),
                Box::new(Constant::new(-1.0)),
            )),
        ]))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        if self.base > 0.0 && self.base != 1.0 {
            return Box::new(Intersection::new(vec![
                Box::new(Equation::new(
                    self.value.clone(),
                    Box::new(Constant::new(0.0)),
                    ComparisonOperator::GreaterThan,
                )),
                self.value.get_real_domain(),
            ]));
        }

        // We say that for negative bases, the log is undefined
        // even though there are some cases where you could define it.
        // (For example, log_-2(-2) = 1)

        return Box::new(EmptySet::new());
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let value = self.value.basic_simplify();
        if value.is_constant() {
            Box::new(Constant::new(self.evaluate(&HashMap::new())))
        } else {
            Box::new(Log::new(self.base, value))
        }
    }
    fn is_constant(&self) -> bool {
        self.value.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Log {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "log_{}({})", self.base, self.value)
    }
}
impl std::fmt::Debug for Log {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "log_{}({})", self.base, self.value)
    }
}
impl ASTNode for Log {}

#[derive(Clone)]
pub struct Sin {
    value: Box<dyn Expression>,
}
impl Sin {
    pub fn new(value: Box<dyn Expression>) -> Self {
        Sin { value }
    }
}
impl Expression for Sin {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        let value = self.value.evaluate(values);
        value.sin()
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        // d/dx(sin(f(x))) = cos(f(x)) f'(x)
        Box::new(Times::new(vec![
            Box::new(Cos::new(self.value.clone())),
            self.value.derivative(variable),
        ]))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        self.value.get_real_domain()
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let value = self.value.basic_simplify();
        if value.is_constant() {
            Box::new(Constant::new(self.evaluate(&HashMap::new())))
        } else {
            Box::new(Sin::new(value))
        }
    }
    fn is_constant(&self) -> bool {
        self.value.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Sin {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "sin({})", self.value)
    }
}
impl std::fmt::Debug for Sin {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "sin({})", self.value)
    }
}
impl ASTNode for Sin {}

#[derive(Clone)]
pub struct Cos {
    value: Box<dyn Expression>,
}
impl Cos {
    pub fn new(value: Box<dyn Expression>) -> Self {
        Cos { value }
    }
}
impl Expression for Cos {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        let value = self.value.evaluate(values);
        value.cos()
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        // d/dx(cos(f(x))) = -sin(f(x)) f'(x)
        Box::new(Minus::new(Box::new(Times::new(vec![
            Box::new(Sin::new(self.value.clone())),
            self.value.derivative(variable),
        ]))))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        self.value.get_real_domain()
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let value = self.value.basic_simplify();
        if value.is_constant() {
            Box::new(Constant::new(self.evaluate(&HashMap::new())))
        } else {
            Box::new(Cos::new(value))
        }
    }
    fn is_constant(&self) -> bool {
        self.value.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Cos {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "cos({})", self.value)
    }
}
impl std::fmt::Debug for Cos {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "cos({})", self.value)
    }
}
impl ASTNode for Cos {}

#[derive(Clone)]
pub struct Tan {
    value: Box<dyn Expression>,
}
impl Tan {
    pub fn new(value: Box<dyn Expression>) -> Self {
        Tan { value }
    }
}
impl Expression for Tan {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        let value = self.value.evaluate(values);
        value.tan()
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        // d/dx(tan(f(x))) = sec^2(f(x)) f'(x)
        Box::new(Times::new(vec![
            Box::new(Power::new(
                Box::new(Inverse::new(Box::new(Cos::new(self.value.clone())))),
                Box::new(Constant::new(2.0)),
            )),
            self.value.derivative(variable),
        ]))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        self.value.get_real_domain()
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let value = self.value.basic_simplify();
        if value.is_constant() {
            Box::new(Constant::new(self.evaluate(&HashMap::new())))
        } else {
            Box::new(Tan::new(value))
        }
    }
    fn is_constant(&self) -> bool {
        self.value.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Tan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "tan({})", self.value)
    }
}
impl std::fmt::Debug for Tan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "tan({})", self.value)
    }
}
impl ASTNode for Tan {}

#[derive(Clone)]
pub struct Abs {
    value: Box<dyn Expression>,
}
impl Abs {
    pub fn new(value: Box<dyn Expression>) -> Self {
        Abs { value }
    }
}
impl Expression for Abs {
    fn evaluate(&self, values: &HashMap<&str, f64>) -> f64 {
        let value = self.value.evaluate(values);
        value.abs()
    }
    fn derivative(&self, variable: &str) -> Box<dyn Expression> {
        // d/dx(abs(f(x))) = f(x) / abs(f(x)) * f'(x)
        Box::new(Times::new(vec![
            self.value.clone(),
            Box::new(Inverse::new(Box::new(Abs::new(self.value.clone())))),
            self.value.derivative(variable),
        ]))
    }
    fn get_real_domain(&self) -> Box<dyn Set> {
        self.value.get_real_domain()
    }
    fn basic_simplify(&self) -> Box<dyn Expression> {
        let value = self.value.basic_simplify();
        if value.is_constant() {
            Box::new(Constant::new(self.evaluate(&HashMap::new())))
        } else {
            Box::new(Abs::new(value))
        }
    }
    fn is_constant(&self) -> bool {
        self.value.is_constant()
    }
    fn clone_dyn(&self) -> Box<dyn Expression> {
        Box::new(self.clone())
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
impl std::fmt::Display for Abs {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "abs({})", self.value)
    }
}
impl std::fmt::Debug for Abs {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "abs({})", self.value)
    }
}
impl ASTNode for Abs {}
