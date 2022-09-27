// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import { Connection } from '@solana/web3.js'

// function addTodoAPI(payload: any) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => resolve(payload), 1000)
//   })
// }

// type CallState = {
//   [func: string]:
//     | {
//         [args: string]: {
//           cachedResult: any | undefined
//           newCall: Promise<any> | undefined
//         }
//       }
//     | undefined
// }

// const initialState: CallState = {}

// // export const call = createAsyncThunk<keyof Connection>('SolanaCall/call', async payload => {
// export const call = createAsyncThunk('SolanaCall/call', async payload => {
//   const data = await addTodoAPI(payload)
//   return data
// })

// export const todoSlice = createSlice({
//   name: 'SolanaCall',
//   initialState,
//   reducers: {},
//   extraReducers: builder => {
//     builder
//       .addCase(call.pending, (state, action) => {
//         state.status = 'pending'
//       })
//       .addCase(call.fulfilled, (state, action) => {
//         state.status = 'idle'
//         state.todos.push(action.payload)
//       })
//   },
// })

// todo namgold: complete this
export {}
