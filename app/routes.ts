import {type RouteConfig, index, route} from "@react-router/dev/routes";
// import { useParams } from 'react-router-dom';

export default [
    index("routes/home.tsx"),
    route("stock/:symbol", "routes/stock_dashboard.tsx"),
    // route("articles/:slug", "routes/article_page.tsx")

] satisfies RouteConfig;
        
    
