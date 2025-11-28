function Validation(formData) {
  let error = {};
  const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const password_pattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,16}$/;

  if (formData.email === "") {
    error.email = "El correo no debe estar vacío";
  } else if (!email_pattern.test(formData.email)) {
    error.email = "El email no coincide";
  }

  if (formData.password === "") {
    error.password = "La contraseña no debe estar vacía";
  } 
  // else if (!password_pattern.test(formData.password)) {
  //   error.password = "La contraseña no coincide";
  // }

  return error;
}

export default Validation;
