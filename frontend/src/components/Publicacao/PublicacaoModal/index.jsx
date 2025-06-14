import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Backdrop,
  Typography,
  CircularProgress,
  List,
  ListItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchPublicacao } from "../../../redux/actions/aplicacao/publicacaoActions";
import { formatarData, formatarMoeda } from "../../../utils/validacao";
import {
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalContent,
  Section,
  ItemContainer,
  ItemLabel,
  ItemValue,
  ListItemStyledText,
  ConteudoBox,
} from "./StyledComponents";

export const PublicacaoModal = ({ open, onClose, publicacaoId }) => {
  const dispatch = useDispatch();
  const { publicacaoAtual, loading } = useSelector((state) => state.publicacao);

  useEffect(() => {
    if (open && publicacaoId) {
      dispatch(fetchPublicacao(publicacaoId));
    }
  }, [dispatch, open, publicacaoId]);

  useEffect(() => {
    if (publicacaoAtual) {
    }
  }, [publicacaoAtual]);

  const handleClose = () => {
    onClose();
  };

  const renderList = (dados) => {
    if (!dados) return null;
    return dados.split("\n").map((item, index) => (
      <ListItem key={index} disableGutters disablePadding>
        <ListItemStyledText>• {item}</ListItemStyledText>
      </ListItem>
    ));
  };

  const renderConteudo = () => {
    if (loading) {
      return (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <CircularProgress />
        </div>
      );
    }

    if (!publicacaoAtual) {
      return (
        <Typography variant="body1" align="center">
          Não foi possível carregar os detalhes da publicação.
        </Typography>
      );
    }

    return (
      <>
        <ModalHeader>
          <ModalTitle>
            Publicação - {publicacaoAtual.numeroProcesso || "Sem número"}
          </ModalTitle>
          <CloseButton onClick={handleClose} aria-label="Fechar">
            <CloseIcon />
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          <Section>
            <ItemContainer>
              <ItemLabel>Data de publicação no DJE:</ItemLabel>
              <ItemValue>
                {publicacaoAtual.dataDisponibilizacao
                  ? formatarData(publicacaoAtual.dataDisponibilizacao)
                  : "Não informado"}
              </ItemValue>
            </ItemContainer>
          </Section>

          <Section>
            <ItemContainer>
              <ItemLabel>Autor (es):</ItemLabel>
              <List dense disablePadding>
                {renderList(publicacaoAtual.autor)}
              </List>
            </ItemContainer>
          </Section>

          <Section>
            <ItemContainer>
              <ItemLabel>Réu:</ItemLabel>
              <List dense disablePadding>
                {renderList(publicacaoAtual.reu)}
              </List>
            </ItemContainer>
          </Section>

          <Section>
            <ItemContainer>
              <ItemLabel>Advogado(s):</ItemLabel>
              <List dense disablePadding>
                {renderList(publicacaoAtual.advogado)}
              </List>
            </ItemContainer>
          </Section>

          <Section>
            <ItemContainer>
              <ItemLabel>Valor principal:</ItemLabel>
              <ItemValue>
                {publicacaoAtual.valorPrincipal
                  ? formatarMoeda(publicacaoAtual.valorPrincipal)
                  : "Não informado"}
              </ItemValue>
            </ItemContainer>
          </Section>

          <Section>
            <ItemContainer>
              <ItemLabel>Valor dos juros moratórios:</ItemLabel>
              <ItemValue>
                {publicacaoAtual.valorJurosMoratorios
                  ? formatarMoeda(publicacaoAtual.valorJurosMoratorios)
                  : "Não informado"}
              </ItemValue>
            </ItemContainer>
          </Section>

          <Section>
            <ItemContainer>
              <ItemLabel>Valor dos honorários advocatícios:</ItemLabel>
              <ItemValue>
                {publicacaoAtual.honorariosAdvocaticios
                  ? formatarMoeda(publicacaoAtual.honorariosAdvocaticios)
                  : "Não informado"}
              </ItemValue>
            </ItemContainer>
          </Section>

          <Section sx={{ mt: 4 }}>
            <ItemContainer>
              <ItemLabel>Conteúdo da Publicação:</ItemLabel>
              <ConteudoBox sx={{ mt: 1 }}>
                <Typography variant="body2">
                  {publicacaoAtual.conteudoCompleto ||
                    "Sem conteúdo informado."}
                </Typography>
              </ConteudoBox>
            </ItemContainer>
          </Section>
        </ModalContent>
      </>
    );
  };

  return (
    <Modal
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose();
        }
      }}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 300,
        sx: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0,0,0,0.1)",
        },
      }}
    >
      <ModalContainer>{renderConteudo()}</ModalContainer>
    </Modal>
  );
};
