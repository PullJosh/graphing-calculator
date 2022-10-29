use serde::{Deserialize, Serialize};

pub trait VecND {
    fn normalize(&self) -> Self;
    fn dot(&self, other: &Self) -> f64;
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Vec1D(pub f64);

impl VecND for Vec1D {
    fn normalize(&self) -> Self {
        Vec1D(self.0)
    }

    fn dot(&self, other: &Self) -> f64 {
        self.0 * other.0
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Vec2D(pub f64, pub f64);

impl VecND for Vec2D {
    fn normalize(&self) -> Vec2D {
        let mut magnitude = (self.0 * self.0 + self.1 * self.1).sqrt();
        if magnitude == 0.0 {
            magnitude = 1.0;
        }
        Vec2D(self.0 / magnitude, self.1 / magnitude)
    }

    fn dot(&self, other: &Vec2D) -> f64 {
        self.0 * other.0 + self.1 * other.1
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Vec3D(pub f64, pub f64, pub f64);

impl VecND for Vec3D {
    fn normalize(&self) -> Vec3D {
        let mut magnitude = (self.0 * self.0 + self.1 * self.1 + self.2 * self.2).sqrt();
        if magnitude == 0.0 {
            magnitude = 1.0;
        }
        Vec3D(self.0 / magnitude, self.1 / magnitude, self.2 / magnitude)
    }

    fn dot(&self, other: &Vec3D) -> f64 {
        self.0 * other.0 + self.1 * other.1 + self.2 * other.2
    }
}
