import React from 'react';
import { getResources } from '@/lib/supabase';
import { FileText, ExternalLink, Download, BookOpen } from 'lucide-react';

export const revalidate = 0;

export default async function ResourcesPage() {
  const resources = await getResources();

  // Group resources by category
  const groupedResources: { [key: string]: typeof resources } = {};
  resources.forEach(res => {
    const category = res.category || 'General';
    if (!groupedResources[category]) {
      groupedResources[category] = [];
    }
    groupedResources[category].push(res);
  });

  return (
    <div className="bg-linen min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans">
            Reference & Guides
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-plum mt-2 mb-6">
            Reading & Resources
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans">
            A curated collection of study guides, travel checklists, reading references, and practical handbooks compiled by the Sanga community.
          </p>
        </div>

        {/* Categories grid */}
        <div className="space-y-12">
          {Object.keys(groupedResources).length > 0 ? (
            Object.keys(groupedResources).sort().map(category => (
              <section key={category} className="space-y-6">
                <div className="flex items-center space-x-3 border-b border-plum/10 pb-3">
                  <BookOpen className="h-5 w-5 text-pink" />
                  <h2 className="font-display text-2xl font-bold text-plum">{category}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedResources[category].map(resource => {
                    const linkUrl = resource.uploaded_file_url || resource.external_url || '#';
                    const isUpload = !!resource.uploaded_file_url;
                    
                    return (
                      <div 
                        key={resource.id} 
                        className="bg-linen p-6 rounded-3xl border border-plum/10 flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-3">
                          <div className="p-2.5 bg-plum/5 rounded-xl w-fit text-plum">
                            <FileText className="h-5 w-5" />
                          </div>
                          <h3 className="font-display text-lg font-bold text-plum leading-tight">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light line-clamp-3">
                            {resource.description}
                          </p>
                        </div>

                        <div className="pt-6 mt-4 border-t border-plum/5">
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-plum text-linen hover:bg-tangerine hover:text-linen font-bold text-xs uppercase tracking-wider rounded-full transition-all duration-200"
                          >
                            {isUpload ? (
                              <>
                                <Download className="mr-1.5 h-3.5 w-3.5" /> Download File
                              </>
                            ) : (
                              <>
                                View Reference <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                              </>
                            )}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-20 bg-plum/5 rounded-3xl border border-dashed border-plum/15 max-w-xl mx-auto">
              <FileText className="mx-auto h-12 w-12 text-plum/25 mb-4" />
              <h3 className="font-display text-xl font-bold text-plum mb-2">No Resources Available</h3>
              <p className="text-sm text-warm-black/60 font-sans">
                There are currently no reference files seeded. Staff members can upload files or link guides through the admin panel.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
