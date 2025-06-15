import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentCompany: null,
  onlyOne: true,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    resetCompany: () => initialState,
    setCompany: (state, action) => {
      state.currentCompany = action.payload;
    },
    setOnlyOne: (state, action) => {
      state.onlyOne = action.payload;
    },
  },
});
export const { setCompany, resetCompany, setOnlyOne } = companySlice.actions;
export default companySlice.reducer;
