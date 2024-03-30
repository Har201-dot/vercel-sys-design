import "./App.css";
import { Landing } from "./components/landing";
import { ThemeProvider } from "./components/theme-provider";

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Landing />
		</ThemeProvider>
	);
}

export default App;
