
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ToolLibrary } from '../components/features/library/ToolLibrary';

export const LibraryPage = () => {
    return (
        <>
            <Helmet>
                <title>AI Tool Arsenal | AimLow AI</title>
                <meta name="description" content="Curated library of the best AI tools for music, writing, images, and productivity. Updated daily." />
            </Helmet>
            <ToolLibrary />
        </>
    );
};
