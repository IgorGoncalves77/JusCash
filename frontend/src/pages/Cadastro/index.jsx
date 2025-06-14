import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Typography, Link, CircularProgress, Box } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { registerUser } from "../../redux/actions/sistema/authActions";
import { useNotification } from "../../context/NotificationContext";
import { validarSenha, senhasIguais } from "../../utils/validacao";
import logo from "../../assets/logo.webp";
import {
  CadastroContainer,
  CadastroCard,
  LogoContainer,
  CadastroForm,
  InputLabel,
  CustomTextField,
  SubmitButton,
  LinkContainer,
  SenhaRequisitosContainer,
  RequisitoItem,
} from "./StyledComponents";

export const Cadastro = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [senhaRequisitos, setSenhaRequisitos] = useState({
    tamanhoMinimo: false,
    temMaiuscula: false,
    temMinuscula: false,
    temNumero: false,
    temEspecial: false,
    valida: false,
  });
  const [senhasConferem, setSenhasConferem] = useState(true);

  const validationSchema = Yup.object({
    nome: Yup.string().required("O nome é obrigatório."),
    email: Yup.string()
      .email("Formato de e-mail inválido.")
      .required("O e-mail é obrigatório."),
    senha: Yup.string().required("A senha é obrigatória."),
    confirmacaoSenha: Yup.string()
      .required("A confirmação de senha é obrigatória.")
      .oneOf([Yup.ref("senha")], "A confirmação de senha não corresponde."),
  });

  const formik = useFormik({
    initialValues: {
      nome: "",
      email: "",
      senha: "",
      confirmacaoSenha: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);

      if (!senhaRequisitos.valida) {
        showNotification(
          "A senha não atende aos requisitos de segurança.",
          "error"
        );
        setIsSubmitting(false);
        return;
      }

      if (!senhasIguais(values.senha, values.confirmacaoSenha)) {
        showNotification("A confirmação de senha não corresponde.", "error");
        setIsSubmitting(false);
        return;
      }

      try {
        const resultado = await dispatch(
          registerUser({
            nome: values.nome,
            email: values.email,
            senha: values.senha,
          })
        ).unwrap();

        navigate("/kanban", {
          state: {
            showWelcomeMessage: true,
            userName: values.nome,
          },
        });
      } catch (error) {
        showNotification(
          error.mensagem || "Erro ao criar conta. Tente novamente.",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (formik.values.senha) {
      const resultado = validarSenha(formik.values.senha);
      setSenhaRequisitos(resultado);
    } else {
      setSenhaRequisitos({
        tamanhoMinimo: false,
        temMaiuscula: false,
        temMinuscula: false,
        temNumero: false,
        temEspecial: false,
        valida: false,
      });
    }
  }, [formik.values.senha]);

  useEffect(() => {
    if (formik.values.senha && formik.values.confirmacaoSenha) {
      setSenhasConferem(formik.values.senha === formik.values.confirmacaoSenha);
    }
  }, [formik.values.senha, formik.values.confirmacaoSenha]);

  return (
    <CadastroContainer>
      <CadastroCard>
        <LogoContainer>
          <Box component="img" src={logo} alt="JusCash" />
        </LogoContainer>

        <CadastroForm onSubmit={formik.handleSubmit}>
          <InputLabel>
            Seu nome completo:{" "}
            <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
              *
            </Box>
          </InputLabel>
          <CustomTextField
            fullWidth
            id="nome"
            name="nome"
            variant="outlined"
            value={formik.values.nome}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.nome && Boolean(formik.errors.nome)}
            helperText={formik.touched.nome && formik.errors.nome}
            disabled={isSubmitting}
          />

          <InputLabel>
            E-mail:{" "}
            <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
              *
            </Box>
          </InputLabel>
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

          <InputLabel>
            Senha:{" "}
            <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
              *
            </Box>
          </InputLabel>
          <CustomTextField
            fullWidth
            id="senha"
            name="senha"
            type="password"
            variant="outlined"
            value={formik.values.senha}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.senha && Boolean(formik.errors.senha)}
            helperText={formik.touched.senha && formik.errors.senha}
            disabled={isSubmitting}
          />

          {formik.values.senha && (
            <SenhaRequisitosContainer>
              <Typography variant="caption" component="div" gutterBottom>
                A senha deve conter:
              </Typography>
              <RequisitoItem valido={senhaRequisitos.tamanhoMinimo}>
                {senhaRequisitos.tamanhoMinimo ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <CancelIcon fontSize="small" />
                )}
                <Typography variant="caption">
                  Pelo menos 8 caracteres
                </Typography>
              </RequisitoItem>
              <RequisitoItem valido={senhaRequisitos.temMaiuscula}>
                {senhaRequisitos.temMaiuscula ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <CancelIcon fontSize="small" />
                )}
                <Typography variant="caption">Uma letra maiúscula</Typography>
              </RequisitoItem>
              <RequisitoItem valido={senhaRequisitos.temMinuscula}>
                {senhaRequisitos.temMinuscula ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <CancelIcon fontSize="small" />
                )}
                <Typography variant="caption">Uma letra minúscula</Typography>
              </RequisitoItem>
              <RequisitoItem valido={senhaRequisitos.temNumero}>
                {senhaRequisitos.temNumero ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <CancelIcon fontSize="small" />
                )}
                <Typography variant="caption">Um número</Typography>
              </RequisitoItem>
              <RequisitoItem valido={senhaRequisitos.temEspecial}>
                {senhaRequisitos.temEspecial ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <CancelIcon fontSize="small" />
                )}
                <Typography variant="caption">
                  Um caractere especial (ex: !@#$)
                </Typography>
              </RequisitoItem>
            </SenhaRequisitosContainer>
          )}

          <InputLabel>
            Confirme sua Senha:{" "}
            <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
              *
            </Box>
          </InputLabel>
          <CustomTextField
            fullWidth
            id="confirmacaoSenha"
            name="confirmacaoSenha"
            type="password"
            variant="outlined"
            value={formik.values.confirmacaoSenha}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.confirmacaoSenha &&
              Boolean(formik.errors.confirmacaoSenha)
            }
            helperText={
              formik.touched.confirmacaoSenha && formik.errors.confirmacaoSenha
            }
            disabled={isSubmitting}
          />

          {formik.values.confirmacaoSenha && !senhasConferem && (
            <Typography variant="caption" color="error">
              A confirmação de senha não corresponde.
            </Typography>
          )}

          <SubmitButton
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Criar Conta"
            )}
          </SubmitButton>
        </CadastroForm>

        <LinkContainer>
          <Link
            component={RouterLink}
            to="/login"
            color="secondary"
            underline="hover"
          >
            Já possui uma conta? Fazer login
          </Link>
        </LinkContainer>
      </CadastroCard>
    </CadastroContainer>
  );
};
