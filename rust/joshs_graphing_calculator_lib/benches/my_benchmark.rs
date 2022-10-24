use joshs_graphing_calculator_lib::{
    graph_equation, graph_equation_2d, mathjson_value_to_equation, GraphBox,
};

use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        n => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("mathjson to equation", |b| {
        b.iter(|| {
            black_box(mathjson_value_to_equation(
                &serde_json::from_str(&"[\"Equal\", \"y\", [\"Power\", \"x\", 2]]".to_string())
                    .unwrap(),
            ))
        })
    });
    c.bench_function("graph equation 2d", |b| {
        let window = GraphBox {
            x_min: -10.0,
            x_max: 10.0,
            y_min: -10.0,
            y_max: 10.0,
        };
        let equation = mathjson_value_to_equation(
            &serde_json::from_str(&"[\"Equal\", \"y\", [\"Power\", \"x\", 2]]".to_string())
                .unwrap(),
        )
        .unwrap();

        b.iter(|| black_box(graph_equation_2d("x", "y", &window, &equation, 7, 3)))
    });
    c.bench_function("graph equation", |b| {
        b.iter(|| {
            black_box(graph_equation(
                "[\"Equal\", \"y\", [\"Power\", \"x\", 2]]".to_string(),
                0,
                0,
                0,
                7,
                3,
            ))
        })
    });
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
