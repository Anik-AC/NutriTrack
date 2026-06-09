import React from "react";
import ReactDOM from "react-dom/client";
import './index.css'
import App from './App.tsx'

import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "./contexts/UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./Components/theme-provider";
import { TooltipProvider } from "./Components/ui/tooltip";
import { Toaster } from "./Components/ui/sonner";
import { queryClient } from "./lib/query-client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// console.log('🧪 Client ID from env:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
// console.log('URL:', import.meta.env.VITE_BACKEND_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<BrowserRouter>
				<QueryClientProvider client={queryClient}>
					<ThemeProvider>
						<TooltipProvider>
							<UserProvider>
								<App />
							</UserProvider>
							<Toaster richColors closeButton position="top-right" />
						</TooltipProvider>
					</ThemeProvider>
				</QueryClientProvider>
			</BrowserRouter>
		</GoogleOAuthProvider>
	</React.StrictMode>
);