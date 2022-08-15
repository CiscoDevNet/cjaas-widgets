function containsEncodedComponents(x) {
  // ie ?,=,&,/ etc
  return decodeURI(x) !== decodeURIComponent(x);
}

//   console.log(containsEncodedComponents('%3Fx%3Dtest')); // ?x=test
// expected output: true

//   console.log(containsEncodedComponents('%D1%88%D0%B5%D0%BB%D0%BB%D1%8B')); // шеллы
// expected output: false

const exampleProfileToken =
  "so%3Dcctsa%26sn%3Dsandbox%26ss%3Dprofile%26sp%3Drw%26se%3D2125-10-29T20%3A20%3A27%3A017Z%26sk%3DUSCCTSA%26sig%3DN9zlu9eN9YpdukC1AgQUJ96WMOwsPk1GqYjLur9PTc0%253D";

// const result = decodeURIComponent(exampleProfileToken);

const sanitize = value => decodeURIComponent(value);

console.log("result", sanitize(exampleProfileToken));

function add(a, b) {
  return a + b;
}
console.log(add(4, 6));
