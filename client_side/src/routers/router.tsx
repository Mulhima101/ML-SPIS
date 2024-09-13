import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/main";

import Counter from "../pages/counter";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "/",
                element: <Counter />
            }
        ]
    }
]);

export default router
