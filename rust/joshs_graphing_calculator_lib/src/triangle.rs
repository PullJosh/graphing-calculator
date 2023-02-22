use crate::point::*;

// pub struct Triangle1D(pub Point1D, pub Point1D, pub Point1D);
pub struct Triangle2D(pub Point2D, pub Point2D, pub Point2D);
pub struct Triangle3D(pub Point3D, pub Point3D, pub Point3D);

impl IntoIterator for Triangle2D {
    type Item = Point2D;
    type IntoIter = std::array::IntoIter<Point2D, 2>;

    fn into_iter(self) -> Self::IntoIter {
        IntoIterator::into_iter([self.0, self.1])
    }
}

impl IntoIterator for Triangle3D {
    type Item = Point3D;
    type IntoIter = std::array::IntoIter<Point3D, 3>;

    fn into_iter(self) -> Self::IntoIter {
        IntoIterator::into_iter([self.0, self.1, self.2])
    }
}
