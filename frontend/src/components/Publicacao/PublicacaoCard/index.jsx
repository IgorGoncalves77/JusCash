import React from "react";
import { Typography, Box } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { calcularTempoDecorrido } from "../../../utils/validacao";
import { CardContainer } from "./StyledComponents";

export const PublicacaoCard = ({ publicacao, provided, handleCardClick }) => {
  const tempoDecorrido = calcularTempoDecorrido(
    publicacao.dataDisponibilizacao
  );

  const dataFormatada = publicacao.dataDisponibilizacao
    ? new Date(publicacao.dataDisponibilizacao).toLocaleDateString("pt-BR")
    : "";

  return (
    <CardContainer
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => handleCardClick(publicacao.id)}
    >
      <Typography
        variant="body1"
        fontWeight="500"
        sx={{
          fontSize: "0.875rem",
          mb: 1,
          color: "#333",
        }}
      >
        {publicacao.numeroProcesso || "Sem número de processo"}
      </Typography>

      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <AccessTimeIcon
            sx={{
              fontSize: "0.875rem",
              color: "text.secondary",
              mr: 0.5,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.75rem",
              color: "text.secondary",
            }}
          >
            {tempoDecorrido}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center">
          <CalendarTodayIcon
            sx={{
              fontSize: "0.875rem",
              color: "text.secondary",
              mr: 0.5,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.75rem",
              color: "text.secondary",
            }}
          >
            {dataFormatada}
          </Typography>
        </Box>
      </Box>
    </CardContainer>
  );
};
