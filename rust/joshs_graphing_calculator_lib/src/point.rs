use std::ops::{Add, AddAssign, Sub};

use serde::{Deserialize, Serialize};

use crate::vector::*;

trait PointND:
    Add
    + Sub
    + AddAssign
    + core::fmt::Debug
    + Clone
    + Copy
    + PartialEq
    + Serialize
    + Deserialize<'static>
{
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Point1D(pub f64);

impl PointND for Point1D {}

impl Add for Point1D {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Point1D(self.0 + other.0)
    }
}

impl Sub for Point1D {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Point1D(self.0 - other.0)
    }
}

impl AddAssign for Point1D {
    fn add_assign(&mut self, other: Self) {
        self.0 += other.0;
    }
}

impl Point1D {
    pub fn to_vec(&self) -> Vec1D {
        Vec1D(self.0)
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Point2D(pub f64, pub f64);

impl PointND for Point2D {}

impl Add for Point2D {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Point2D(self.0 + other.0, self.1 + other.1)
    }
}

impl Sub for Point2D {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Point2D(self.0 - other.0, self.1 - other.1)
    }
}

impl AddAssign for Point2D {
    fn add_assign(&mut self, other: Self) {
        self.0 += other.0;
        self.1 += other.1;
    }
}

impl Point2D {
    pub fn to_vec(&self) -> Vec2D {
        Vec2D(self.0, self.1)
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Point3D(pub f64, pub f64, pub f64);

impl PointND for Point3D {}

impl Add for Point3D {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Point3D(self.0 + other.0, self.1 + other.1, self.2 + other.2)
    }
}

impl Sub for Point3D {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Point3D(self.0 - other.0, self.1 - other.1, self.2 - other.2)
    }
}

impl AddAssign for Point3D {
    fn add_assign(&mut self, other: Self) {
        self.0 += other.0;
        self.1 += other.1;
        self.2 += other.2;
    }
}

impl Point3D {
    pub fn to_vec(&self) -> Vec3D {
        Vec3D(self.0, self.1, self.2)
    }
}
