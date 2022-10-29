use serde::{Deserialize, Serialize};

use crate::point::*;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Segment1D(pub Point1D, pub Point1D);

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Segment2D(pub Point2D, pub Point2D);

// pub struct Segment3D(pub Point3D, pub Point3D);

pub type Contour2D = Vec<Point2D>;

// pub type Contour3D = Vec<Point3D>;
