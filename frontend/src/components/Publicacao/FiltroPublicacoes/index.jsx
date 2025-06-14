import React from "react";
import { Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  FiltersContainer,
  SearchContainer,
  DateContainer,
  TitleContainer,
  Label,
  LabelDate,
  SearchTextField,
  StyledTextField,
  InlineGroup,
  SearchButton,
  ClearButton,
} from "./StyledComponents";

export const FiltroPublicacoes = ({
  filtros,
  handlePesquisaChange,
  handleDataInicioChange,
  handleDataFimChange,
  aplicarFiltros,
  limparFiltros,
}) => {
  return (
    <FiltersContainer>
      <SearchContainer>
        <Label variant="body2">Pesquisar</Label>
        <SearchTextField
          placeholder="Digite o número do processo ou nome das partes envolvidas"
          size="small"
          value={filtros.textoPesquisa}
          onChange={handlePesquisaChange}
        />
      </SearchContainer>

      <DateContainer>
        <TitleContainer>
          <Label variant="body2">Data do diário</Label>
          {(filtros.textoPesquisa || filtros.dataInicio || filtros.dataFim) && (
            <ClearButton onClick={limparFiltros}>Limpar</ClearButton>
          )}
        </TitleContainer>

        <InlineGroup>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flex: 1,
            }}
          >
            <LabelDate>De:</LabelDate>
            <StyledTextField
              type="date"
              size="small"
              value={filtros.dataInicio}
              onChange={handleDataInicioChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flex: 1,
            }}
          >
            <LabelDate>Até:</LabelDate>
            <StyledTextField
              type="date"
              size="small"
              value={filtros.dataFim}
              onChange={handleDataFimChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <SearchButton onClick={aplicarFiltros}>
              <SearchIcon fontSize="small" />
            </SearchButton>
          </Box>
        </InlineGroup>
      </DateContainer>
    </FiltersContainer>
  );
};
