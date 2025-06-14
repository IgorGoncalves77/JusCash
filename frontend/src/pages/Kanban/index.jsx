import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import { Snackbar, Alert } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { useNotification } from "../../context/NotificationContext";
import {
  fetchPublicacoes,
  updatePublicacaoStatusAction,
} from "../../redux/actions/aplicacao/publicacaoActions";
import { Navbar } from "../../components/Navbar";
import { FiltroPublicacoes } from "../../components/Publicacao/FiltroPublicacoes";
import { PublicacaoModal } from "../../components/Publicacao/PublicacaoModal";
import { PublicacaoColuna } from "../../components/Publicacao/PublicacaoColuna";
import {
  KanbanContainer,
  HeaderContainer,
  HeaderTitleBox,
  TitleIcon,
  Title,
  KanbanContent,
  KanbanColumnsContainer,
} from "./StyledComponents";

export const Kanban = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { showNotification } = useNotification();

  const [notificacao, setNotificacao] = useState({
    aberta: false,
    mensagem: "",
    tipo: "info",
  });

  const [filtros, setFiltros] = useState({
    textoPesquisa: "",
    dataInicio: "",
    dataFim: "",
  });

  const {
    publicacoesNovas,
    publicacoesLidas,
    publicacoesEnviadas,
    publicacoesConcluidas,
    paginacao,
  } = useSelector((state) => state.publicacao);

  const [carregandoMais, setCarregandoMais] = useState({
    nova: false,
    lida: false,
    enviada: false,
    concluida: false,
  });

  const [carregandoInicial, setCarregandoInicial] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [publicacaoSelecionada, setPublicacaoSelecionada] = useState(null);

  useEffect(() => {
    if (location.state?.showWelcomeMessage && location.state?.userName) {
      const firstName = location.state.userName.split(" ")[0];
      showNotification(
        `Bem-vindo ao JusCash, ${firstName}! Sua conta foi criada com sucesso.`,
        "success",
        7000
      );

      window.history.replaceState({}, document.title);
    }
  }, [location.state, showNotification]);

  useEffect(() => {
    if (carregandoInicial) return;

    setCarregandoInicial(true);

    Promise.all([
      dispatch(fetchPublicacoes({ status: "nova", page: 1, limit: 50 })),
      dispatch(fetchPublicacoes({ status: "lida", page: 1, limit: 50 })),
      dispatch(fetchPublicacoes({ status: "enviada", page: 1, limit: 50 })),
      dispatch(fetchPublicacoes({ status: "processada", page: 1, limit: 50 })),
    ]).finally(() => {
      setCarregandoInicial(false);
    });
  }, [dispatch]);

  const colunas = [
    {
      id: "nova",
      titulo: "Nova Publicação",
      data: Array.isArray(publicacoesNovas) ? publicacoesNovas : [],
      descricao:
        'Publicações novas que precisam ser analisadas e podem ser movidas para "Publicações Lidas".',
    },
    {
      id: "lida",
      titulo: "Publicação Lida",
      data: Array.isArray(publicacoesLidas) ? publicacoesLidas : [],
      descricao:
        'Publicações que foram revisadas e classificadas como lidas. Podem ser movidas apenas para "Enviadas para ADV".',
    },
    {
      id: "enviada",
      titulo: "Enviar para Advogado Responsável",
      data: Array.isArray(publicacoesEnviadas) ? publicacoesEnviadas : [],
      descricao:
        'Publicações enviadas para o advogado. Podem ser movidas de volta para "Publicações Lidas" ou para "Concluídas".',
    },
    {
      id: "processada",
      titulo: "Concluído",
      icon: (
        <CheckBoxIcon sx={{ color: (theme) => theme.palette.success.main }} />
      ),
      data: Array.isArray(publicacoesConcluidas) ? publicacoesConcluidas : [],
      descricao:
        "Publicações finalizadas. Não podem ser movidas para outras colunas.",
    },
  ];

  const fecharNotificacao = () => {
    setNotificacao((prev) => ({ ...prev, aberta: false }));
  };

  const mostrarNotificacao = (mensagem, tipo = "info") => {
    setNotificacao({
      aberta: true,
      mensagem,
      tipo,
    });
  };

  const handlePesquisaChange = (e) => {
    setFiltros((prev) => ({
      ...prev,
      textoPesquisa: e.target.value,
    }));
  };

  const handleDataInicioChange = (e) => {
    setFiltros((prev) => ({
      ...prev,
      dataInicio: e.target.value,
    }));
  };

  const handleDataFimChange = (e) => {
    setFiltros((prev) => ({
      ...prev,
      dataFim: e.target.value,
    }));
  };

  const aplicarFiltros = () => {
    const filtrosLimpos = {};
    if (filtros.textoPesquisa)
      filtrosLimpos.textoPesquisa = filtros.textoPesquisa;
    if (filtros.dataInicio) filtrosLimpos.dataInicio = filtros.dataInicio;
    if (filtros.dataFim) filtrosLimpos.dataFim = filtros.dataFim;

    dispatch(
      fetchPublicacoes({
        status: "nova",
        page: 1,
        limit: 50,
        filters: filtrosLimpos,
      })
    );
    dispatch(
      fetchPublicacoes({
        status: "lida",
        page: 1,
        limit: 50,
        filters: filtrosLimpos,
      })
    );
    dispatch(
      fetchPublicacoes({
        status: "enviada",
        page: 1,
        limit: 50,
        filters: filtrosLimpos,
      })
    );
    dispatch(
      fetchPublicacoes({
        status: "processada",
        page: 1,
        limit: 50,
        filters: filtrosLimpos,
      })
    );

    if (filtros.textoPesquisa || filtros.dataInicio || filtros.dataFim) {
      mostrarNotificacao("Filtros aplicados com sucesso", "success");
    }
  };

  const limparFiltros = () => {
    setFiltros({
      textoPesquisa: "",
      dataInicio: "",
      dataFim: "",
    });

    dispatch(fetchPublicacoes({ status: "nova", page: 1, limit: 50 }));
    dispatch(fetchPublicacoes({ status: "lida", page: 1, limit: 50 }));
    dispatch(fetchPublicacoes({ status: "enviada", page: 1, limit: 50 }));
    dispatch(fetchPublicacoes({ status: "processada", page: 1, limit: 50 }));

    mostrarNotificacao("Filtros removidos", "info");
  };

  const handleScroll = (event, status) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;

    const scrollThreshold = scrollHeight * 0.7;
    const currentScroll = scrollTop + clientHeight;

    if (currentScroll >= scrollThreshold) {
      const paginacaoMap = {
        nova: paginacao.nova || { pagina: 1, totalPaginas: 1, total: 0 },
        lida: paginacao.lida || { pagina: 1, totalPaginas: 1, total: 0 },
        enviada: paginacao.enviada || { pagina: 1, totalPaginas: 1, total: 0 },
        processada: paginacao.processada || {
          pagina: 1,
          totalPaginas: 1,
          total: 0,
        },
      };

      const paginacaoAtual = paginacaoMap[status];

      if (
        !carregandoMais[status] &&
        paginacaoAtual &&
        paginacaoAtual.pagina < paginacaoAtual.totalPaginas
      ) {
        setCarregandoMais((prev) => ({ ...prev, [status]: true }));

        dispatch(
          fetchPublicacoes({
            status,
            page: paginacaoAtual.pagina + 1,
            limit: 50,
            filters: filtros,
          })
        ).finally(() => {
          setCarregandoMais((prev) => ({ ...prev, [status]: false }));
        });
      }
    }
  };

  const handleCardClick = (publicacaoId) => {
    setPublicacaoSelecionada(publicacaoId);
    setModalAberto(true);
  };

  const handleCloseModal = () => {
    setModalAberto(false);
    setPublicacaoSelecionada(null);
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      return;
    }

    const regrasMovimentacao = {
      nova: ["lida"],
      lida: ["enviada"],
      enviada: ["lida", "processada"],
      processada: [],
    };

    const mensagensErro = {
      "lida-nova": 'Publicações lidas não podem retornar para "Novas".',
      "lida-processada":
        "Publicações lidas devem ser enviadas ao advogado antes de serem concluídas.",
      "processada-nova": "Publicações concluídas não podem ser movidas.",
      "processada-lida": "Publicações concluídas não podem ser movidas.",
      "processada-enviada": "Publicações concluídas não podem ser movidas.",
      "nova-enviada":
        "Publicações novas devem ser lidas antes de enviadas ao advogado.",
      "nova-processada":
        "Publicações novas devem ser lidas e enviadas ao advogado antes de concluídas.",
    };

    const movimentoPermitido = regrasMovimentacao[source.droppableId]?.includes(
      destination.droppableId
    );

    if (!movimentoPermitido) {
      const chaveErro = `${source.droppableId}-${destination.droppableId}`;
      const mensagemErro =
        mensagensErro[chaveErro] || "Esta movimentação não é permitida.";

      mostrarNotificacao(mensagemErro, "warning");
      return;
    }

    const columnMap = {
      nova: publicacoesNovas,
      lida: publicacoesLidas,
      enviada: publicacoesEnviadas,
      processada: publicacoesConcluidas,
    };

    const sourceItems = columnMap[source.droppableId];
    if (!sourceItems || sourceItems.length === 0) {
      console.error("Lista de origem vazia ou não existe");
      return;
    }

    if (source.index >= sourceItems.length) {
      console.error("Índice inválido");
      return;
    }

    const publicacaoMovida = sourceItems[source.index];
    if (!publicacaoMovida) {
      console.error("Publicação não encontrada");
      return;
    }

    dispatch(
      updatePublicacaoStatusAction({
        id: publicacaoMovida.id,
        status: destination.droppableId,
      })
    );
  };

  return (
    <>
      <Navbar />
      <KanbanContainer>
        <HeaderContainer>
          <HeaderTitleBox>
            <TitleIcon />
            <Title>Publicações</Title>
          </HeaderTitleBox>

          <FiltroPublicacoes
            filtros={filtros}
            handlePesquisaChange={handlePesquisaChange}
            handleDataInicioChange={handleDataInicioChange}
            handleDataFimChange={handleDataFimChange}
            aplicarFiltros={aplicarFiltros}
            limparFiltros={limparFiltros}
          />
        </HeaderContainer>

        <KanbanContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <KanbanColumnsContainer>
              {colunas.map((coluna) => (
                <PublicacaoColuna
                  key={coluna.id}
                  coluna={coluna}
                  handleScroll={handleScroll}
                  handleCardClick={handleCardClick}
                  carregandoMais={carregandoMais}
                />
              ))}
            </KanbanColumnsContainer>
          </DragDropContext>
        </KanbanContent>
      </KanbanContainer>

      <Snackbar
        open={notificacao.aberta}
        autoHideDuration={4000}
        onClose={fecharNotificacao}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={fecharNotificacao}
          severity={notificacao.tipo}
          sx={{ width: "100%" }}
        >
          {notificacao.mensagem}
        </Alert>
      </Snackbar>

      <PublicacaoModal
        open={modalAberto}
        onClose={handleCloseModal}
        publicacaoId={publicacaoSelecionada}
      />
    </>
  );
};
