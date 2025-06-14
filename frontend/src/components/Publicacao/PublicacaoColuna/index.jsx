import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Typography, Box } from "@mui/material";
import { PublicacaoCard } from "../PublicacaoCard";
import {
  ColumnContainer,
  ColumnHeader,
  ColumnTitle,
  CardsContainer,
  EmptyColumn,
  ColumnCount,
} from "./StyledComponents";

export const PublicacaoColuna = ({
  coluna,
  handleScroll,
  handleCardClick,
  carregandoMais,
}) => {
  return (
    <ColumnContainer status={coluna.id}>
      <ColumnHeader>
        <ColumnTitle variant="h6" isConcluido={coluna.id === "processada"}>
          {coluna.icon}
          {coluna.titulo}
          <ColumnCount>{coluna.data.length}</ColumnCount>
        </ColumnTitle>
      </ColumnHeader>

      <Droppable droppableId={coluna.id}>
        {(provided, snapshot) => (
          <CardsContainer
            ref={provided.innerRef}
            {...provided.droppableProps}
            onScroll={(e) => handleScroll(e, coluna.id)}
            style={{
              backgroundColor: snapshot.isDraggingOver
                ? "rgba(0, 0, 0, 0.05)"
                : "inherit",
              transition: "background-color 0.2s ease",
            }}
          >
            {coluna.data.length > 0 ? (
              coluna.data.map((publicacao, index) => (
                <Draggable
                  key={publicacao.id}
                  draggableId={String(publicacao.id)}
                  index={index}
                >
                  {(dragProvided) => (
                    <PublicacaoCard
                      publicacao={publicacao}
                      provided={dragProvided}
                      handleCardClick={handleCardClick}
                    />
                  )}
                </Draggable>
              ))
            ) : (
              <EmptyColumn>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Nenhum card encontrado
                </Typography>
              </EmptyColumn>
            )}
            {provided.placeholder}

            {carregandoMais[coluna.id] && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="caption">Carregando mais...</Typography>
              </Box>
            )}
          </CardsContainer>
        )}
      </Droppable>
    </ColumnContainer>
  );
};
