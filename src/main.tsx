
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { SillytavernProvider } from "./hooks/SillytavernProvider";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <SillytavernProvider>
      <App />
    </SillytavernProvider>
  );
