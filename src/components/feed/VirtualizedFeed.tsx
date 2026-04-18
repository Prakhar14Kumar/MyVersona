/**
 * High-Performance Virtualized Feed
 * Exclusively loads DOM nodes that are currently within the viewport,
 * guaranteeing 60fps scrolling even with thousands of dynamic posts.
 */
import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PostCard } from '../PostCard'; // your existing post component wrapper
import { apiClient } from '../../lib/apiClient';
import { usePersonaStore } from '../../store/personaStore';

export const VirtualizedFeed = () => {
    const { persona } = usePersonaStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [feedIds, setFeedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch whenever Persona Swaps (Swaps out the entire underlying Feed Engine)
    useEffect(() => {
        loadSmartFeed();
    }, [persona]);

    const loadSmartFeed = async () => {
        setLoading(true);
        try {
            // Because we're using our new backend, we ask for our cached algorithm!
            // E.g. trigger generate, then fetch. For simplicity, hitting fetch directly:
            const result: any = await apiClient.get(`/api/feed/fetch?persona=${persona}`);
            if (result?.data) setFeedIds(result.data);
        } catch (e) {
            console.error("Feed load failed");
        } finally {
            setLoading(false);
        }
    };

    // React-Virtual Hook Configuration
    const rowVirtualizer = useVirtualizer({
        count: feedIds.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 450, // rough height of a standard PostCard
        overscan: 5, // keep 5 posts rendered out of sight to prevent flickering
    });

    if (loading) return <div className="text-center p-10">Loading Your {persona} Feed...</div>;

    return (
        <div 
            ref={scrollRef} 
            className="w-full h-screen overflow-y-auto overflow-x-hidden pt-20 pb-32"
            style={{ 
                // Dynamically modify background based on persona!
                backgroundColor: persona === 'career' ? '#f8f9fa' : '#fff5f8' 
            }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
                className="max-w-2xl mx-auto"
            >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                            paddingBottom: '24px' // Spacing between posts
                        }}
                    >
                        {/* 
                            Pass the ID down. Your PostCard component should 
                            intelligently fetch its own detailed data efficiently from Cache or Backend given an ID.
                        */}
                        <PostCard postId={feedIds[virtualItem.index]} personaMode={persona} />
                    </div>
                ))}
            </div>
        </div>
    );
};
