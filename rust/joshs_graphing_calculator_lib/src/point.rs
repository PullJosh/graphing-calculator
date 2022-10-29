use std::ops::{Add, Sub};

#[derive(Debug, Clone, Copy)]
pub struct Point1D(pub f64);

#[derive(Debug, Clone, Copy)]
pub struct Point2D(pub f64, pub f64);

#[derive(Debug, Clone, Copy)]
pub struct Point3D(pub f64, pub f64, pub f64);

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
