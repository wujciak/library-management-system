import { LibraryClient } from './library-client';
import { createContext, useContext } from 'react';

// One client for the whole app; the token is read from storage on every request.
const client = new LibraryClient();
const ApiContext = createContext(client);

export default function ApiProvider({ children }: { children: React.ReactNode }) {
    return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi() {
    return useContext(ApiContext);
}
