import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Link,
  CircularProgress,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { loginUser } from "../../redux/actions/sistema/authActions";
import { useNotification } from "../../context/NotificationContext";
import { validarEmail } from "../../utils/validacao";
import logo from "../../assets/logo.webp";
import {
  LoginContainer,
  LoginCard,
  LogoContainer,
  LoginForm,
  InputLabel,
  CustomTextField,
  SubmitButton,
  LinkContainer,
} from "./StyledComponents";

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Formato de e-mail inválido.")
      .required("O e-mail é obrigatório."),
    senha: Yup.string().required("A senha é obrigatória."),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      senha: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);

      if (!validarEmail(values.email)) {
        showNotification("Formato de e-mail inválido.", "error");
        setIsSubmitting(false);
        return;
      }

      try {
        const resultado = await dispatch(
          loginUser({
            email: values.email,
            senha: values.senha,
          })
        ).unwrap();

        navigate("/kanban");
      } catch (error) {
        showNotification(
          error.mensagem ||
            "Credenciais inválidas. Verifique o e-mail e a senha e tente novamente.",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <Box component="img" src={logo} alt="JusCash" />
        </LogoContainer>

        <LoginForm onSubmit={formik.handleSubmit}>
          <InputLabel>E-mail:</InputLabel>
          <CustomTextField
            fullWidth
            id="email"
            name="email"
            variant="outlined"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            disabled={isSubmitting}
          />

          <InputLabel>Senha:</InputLabel>
          <CustomTextField
            fullWidth
            id="senha"
            name="senha"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            value={formik.values.senha}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.senha && Boolean(formik.errors.senha)}
            helperText={formik.touched.senha && formik.errors.senha}
            disabled={isSubmitting}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <SubmitButton
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Login"
            )}
          </SubmitButton>
        </LoginForm>

        <LinkContainer>
          <Link
            component={RouterLink}
            to="/cadastro"
            color="secondary"
            underline="always"
          >
            Não possui uma conta? Cadastre-se
          </Link>
        </LinkContainer>
      </LoginCard>
    </LoginContainer>
  );
};
