import React from 'react';
import { getResources } from '@/lib/supabase';
import { FileText, ExternalLink, Download, BookOpen, Sparkles } from 'lucide-react';

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

  // Filter categories to only keep those that have at least one resource
  const activeCategories = Object.keys(groupedResources)
    .filter(category => groupedResources[category].length > 0)
    .sort();

  return (
    <div className="bg-linen min-h-screen font-sans pb-24 text-warm-black">
      {/* Wave Header Section */}
      <div className="relative bg-plum text-linen pt-16 pb-32 overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-sunshine/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-10 bottom-10 w-80 h-80 bg-pink/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sunshine/20 border border-sunshine/40 text-sunshine text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> Reference & Guides
          </span>
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
            Reading & <span className="text-sunshine">Resources</span>
          </h1>
          <p className="text-lg sm:text-xl text-linen/85 max-w-2xl mx-auto font-light leading-relaxed">
            A curated collection of study guides, travel checklists, reading references, and practical handbooks compiled by the Sanga community.
          </p>
        </div>

        {/* Wave Border */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-12 text-linen fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,100 600,20 900,80 L1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 mt-12 relative z-20">
        <div className="space-y-16">
          {activeCategories.length > 0 ? (
            activeCategories.map(category => (
              <section key={category} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-plum/10 pb-4">
                  <div className="p-2 bg-sunshine/20 rounded-lg text-plum">
                    <Sparkles className="h-5 w-5 text-plum" />
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-plum">{category}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {groupedResources[category].map(resource => {
                    const linkUrl = resource.uploaded_file_url || resource.external_url || '#';
                    const isUpload = !!resource.uploaded_file_url;
                    
                    return (
                      <div 
                        key={resource.id} 
                        className="bg-linen p-8 rounded-[2rem] border border-plum/10 flex flex-col justify-between hover:border-plum/30 transition-all duration-300 hover:shadow-lg group relative overflow-hidden"
                      >
                        <div className="space-y-4">
                          <div className="p-3 bg-plum/5 rounded-xl w-fit text-plum group-hover:bg-sunshine/25 transition-colors">
                            <FileText className="h-6 w-6" />
                          </div>
                          <h3 className="font-display text-xl font-bold text-plum leading-snug group-hover:text-pink transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-warm-black/80 leading-relaxed font-sans font-light line-clamp-4">
                            {resource.description}
                          </p>
                        </div>

                        <div className="pt-6 mt-6 border-t border-plum/5">
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-5 py-3 bg-plum text-linen hover:bg-sunshine hover:text-plum font-bold text-xs uppercase tracking-wider rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            {isUpload ? (
                              <>
                                <Download className="mr-2 h-4 w-4" /> Download File
                              </>
                            ) : (
                              <>
                                View Reference <ExternalLink className="ml-2 h-4 w-4" />
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
            <div className="text-center py-20 bg-plum/5 rounded-[2.5rem] border border-dashed border-plum/20 max-w-xl mx-auto px-6">
              <FileText className="mx-auto h-16 w-16 text-plum/30 mb-4" />
              <h3 className="font-display text-2xl font-bold text-plum mb-2">No Resources Available</h3>
              <p className="text-sm text-warm-black/60 font-sans max-w-sm mx-auto leading-relaxed">
                There are currently no reference files seeded. Staff members can upload files or link guides through the admin panel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
