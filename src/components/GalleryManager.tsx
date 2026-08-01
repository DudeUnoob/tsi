'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { AlbumMedia, RetreatAlbum, RetreatSeries } from '@/lib/gallery-albums';

interface GalleryManagerProps {
  value: RetreatSeries[];
  onChange: (series: RetreatSeries[]) => void;
  onSave: (series: RetreatSeries[]) => Promise<void> | void;
  saving?: boolean;
  renderCoverUploader?: (
    album: RetreatAlbum,
    onChange: (coverImage: string) => void,
  ) => ReactNode;
}

function uniqueId(prefix: string, ids: Set<string>): string {
  if (!ids.has(prefix)) return prefix;
  let suffix = 2;
  while (ids.has(`${prefix}-${suffix}`)) suffix += 1;
  return `${prefix}-${suffix}`;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isGooglePhotosUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'photos.app.goo.gl';
  } catch {
    return false;
  }
}

export function galleryEditorErrors(series: RetreatSeries[]): string[] {
  const errors: string[] = [];
  const groupIds = new Set<string>();
  const albumIds = new Set<string>();

  for (const group of series) {
    if (!group.id.trim()) errors.push('Every group needs an ID.');
    if (groupIds.has(group.id)) errors.push(`Duplicate group ID: ${group.id}`);
    groupIds.add(group.id);
    if (!group.name.trim()) errors.push(`Group ${group.id || '(untitled)'} needs a name.`);

    for (const album of group.albums) {
      if (!album.id.trim()) errors.push(`Every album in ${group.name || group.id} needs an ID.`);
      if (albumIds.has(album.id)) errors.push(`Duplicate album ID: ${album.id}`);
      albumIds.add(album.id);
      if (!album.title.trim()) errors.push(`Album ${album.id || '(untitled)'} needs a title.`);
      if (!album.dates.trim()) errors.push(`Album ${album.id || '(untitled)'} needs a date label.`);
      if (!Number.isInteger(album.year) || album.year < 2000 || album.year > 2100) {
        errors.push(`Album ${album.id || '(untitled)'} needs a year from 2000 to 2100.`);
      }
      if (album.url && !isGooglePhotosUrl(album.url)) {
        errors.push(`${album.title || album.id} needs an HTTPS Google Photos share URL.`);
      }
      if (album.coverImage && !isHttpsUrl(album.coverImage)) {
        errors.push(`${album.title || album.id} needs an HTTPS cover image URL.`);
      }
      if (!album.url && !album.pendingNote?.trim()) {
        errors.push(`${album.title || album.id} needs an album URL or a pending message.`);
      }
    }
  }

  return [...new Set(errors)];
}

const inputClass =
  'w-full rounded-xl border border-plum/15 bg-white px-3 py-2.5 text-sm text-warm-black outline-none transition focus:border-plum focus:ring-2 focus:ring-plum/15';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-plum/65';

function Field({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
  readOnly = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'url' | 'number';
  min?: number;
  max?: number;
  readOnly?: boolean;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        readOnly={readOnly}
        onChange={event => onChange(event.target.value)}
        className={`${inputClass} ${readOnly ? 'cursor-default bg-plum/5 text-warm-black/55' : ''}`}
      />
    </label>
  );
}

export default function GalleryManager({
  value,
  onChange,
  onSave,
  saving = false,
  renderCoverUploader,
}: GalleryManagerProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(value[0] ? [value[0].id] : []),
  );
  const [saveError, setSaveError] = useState('');
  const errors = useMemo(() => galleryEditorErrors(value), [value]);

  const updateGroup = (groupIndex: number, changes: Partial<RetreatSeries>) => {
    onChange(value.map((group, index) => (index === groupIndex ? { ...group, ...changes } : group)));
  };

  const updateAlbum = (
    groupIndex: number,
    albumIndex: number,
    changes: Partial<RetreatAlbum>,
  ) => {
    onChange(
      value.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              albums: group.albums.map((album, currentAlbumIndex) =>
                currentAlbumIndex === albumIndex ? { ...album, ...changes } : album,
              ),
            }
          : group,
      ),
    );
  };

  const moveGroup = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const moveAlbum = (groupIndex: number, albumIndex: number, direction: -1 | 1) => {
    const albums = [...value[groupIndex].albums];
    const target = albumIndex + direction;
    if (target < 0 || target >= albums.length) return;
    [albums[albumIndex], albums[target]] = [albums[target], albums[albumIndex]];
    updateGroup(groupIndex, { albums });
  };

  const addGroup = () => {
    const id = uniqueId('new-group', new Set(value.map(group => group.id)));
    onChange([
      ...value,
      { id, name: 'New group', blurb: '', published: false, albums: [] },
    ]);
    setOpenGroups(current => new Set(current).add(id));
  };

  const addAlbum = (groupIndex: number) => {
    const ids = new Set(value.flatMap(group => group.albums.map(album => album.id)));
    const id = uniqueId(`${value[groupIndex].id}-album`, ids);
    updateGroup(groupIndex, {
      albums: [
        ...value[groupIndex].albums,
        {
          id,
          title: 'New album',
          dates: 'Dates coming soon',
          year: new Date().getFullYear(),
          media: 'photos',
          published: false,
          pendingNote: 'Album coming soon.',
        },
      ],
    });
  };

  const removeGroup = (index: number) => {
    const group = value[index];
    if (!window.confirm(`Delete the ${group.name} group and all of its albums?`)) return;
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  const removeAlbum = (groupIndex: number, albumIndex: number) => {
    const album = value[groupIndex].albums[albumIndex];
    if (!window.confirm(`Delete ${album.title}?`)) return;
    updateGroup(groupIndex, {
      albums: value[groupIndex].albums.filter((_, index) => index !== albumIndex),
    });
  };

  const save = async () => {
    if (errors.length > 0 || saving) return;
    setSaveError('');
    try {
      await onSave(value);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the gallery.');
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="gallery-manager-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="gallery-manager-heading" className="font-display text-2xl font-bold text-plum">
            Groups and albums
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-warm-black/65">
            Arrange public gallery groups and albums. Draft items stay hidden until published.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addGroup}
            className="inline-flex items-center gap-2 rounded-full border border-plum/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-plum transition hover:bg-plum/5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add group
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || errors.length > 0}
            className="inline-flex items-center gap-2 rounded-full bg-plum px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-plum/90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving' : 'Save gallery'}
          </button>
        </div>
      </div>

      {(errors.length > 0 || saveError) && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {saveError || errors[0]}
          {errors.length > 1 ? ` (${errors.length - 1} more)` : ''}
        </div>
      )}

      {value.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-plum/25 p-8 text-center text-sm text-warm-black/60">
          Add a group to begin building the gallery.
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((group, groupIndex) => {
            const isOpen = openGroups.has(group.id);
            return (
              <article key={group.id} className="overflow-hidden rounded-2xl border border-plum/15 bg-white">
                <div className="flex items-center gap-2 border-b border-plum/10 p-3 sm:p-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${group.id}-admin-panel`}
                    onClick={() =>
                      setOpenGroups(current => {
                        const next = new Set(current);
                        if (next.has(group.id)) next.delete(group.id);
                        else next.add(group.id);
                        return next;
                      })
                    }
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg font-bold text-plum">
                        {group.name || 'Untitled group'}
                      </span>
                      <span className="block truncate text-xs text-warm-black/50">
                        {group.id} / {group.albums.length} album{group.albums.length === 1 ? '' : 's'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-plum transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${group.name} up`}
                    disabled={groupIndex === 0}
                    onClick={() => moveGroup(groupIndex, -1)}
                    className="rounded-lg p-2 text-plum hover:bg-plum/5 disabled:opacity-25"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${group.name} down`}
                    disabled={groupIndex === value.length - 1}
                    onClick={() => moveGroup(groupIndex, 1)}
                    className="rounded-lg p-2 text-plum hover:bg-plum/5 disabled:opacity-25"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${group.name}`}
                    onClick={() => removeGroup(groupIndex)}
                    className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                {isOpen && (
                  <div id={`${group.id}-admin-panel`} className="space-y-6 p-4 sm:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Stable ID" value={group.id} onChange={() => {}} readOnly />
                      <Field
                        label="Group name"
                        value={group.name}
                        onChange={name => updateGroup(groupIndex, { name })}
                      />
                      <label className="md:col-span-2">
                        <span className={labelClass}>Group blurb</span>
                        <textarea
                          value={group.blurb}
                          onChange={event => updateGroup(groupIndex, { blurb: event.target.value })}
                          rows={2}
                          className={inputClass}
                        />
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-plum">
                        <input
                          type="checkbox"
                          checked={group.published !== false}
                          onChange={event =>
                            updateGroup(groupIndex, { published: event.target.checked })
                          }
                          className="h-4 w-4 accent-plum"
                        />
                        Published
                      </label>
                    </div>

                    <div className="space-y-4">
                      {group.albums.map((album, albumIndex) => (
                        <div key={album.id} className="rounded-2xl bg-linen/70 p-4 sm:p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <h3 className="font-display font-bold text-plum">
                                {album.title || 'Untitled album'}
                              </h3>
                              <p className="text-xs text-warm-black/50">{album.id}</p>
                            </div>
                            <div className="flex">
                              <button
                                type="button"
                                aria-label={`Move ${album.title} up`}
                                disabled={albumIndex === 0}
                                onClick={() => moveAlbum(groupIndex, albumIndex, -1)}
                                className="rounded-lg p-2 text-plum hover:bg-white disabled:opacity-25"
                              >
                                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Move ${album.title} down`}
                                disabled={albumIndex === group.albums.length - 1}
                                onClick={() => moveAlbum(groupIndex, albumIndex, 1)}
                                className="rounded-lg p-2 text-plum hover:bg-white disabled:opacity-25"
                              >
                                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${album.title}`}
                                onClick={() => removeAlbum(groupIndex, albumIndex)}
                                className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Stable ID" value={album.id} onChange={() => {}} readOnly />
                            <Field
                              label="Title"
                              value={album.title}
                              onChange={title => updateAlbum(groupIndex, albumIndex, { title })}
                            />
                            <Field
                              label="Subtitle"
                              value={album.subtitle ?? ''}
                              onChange={subtitle =>
                                updateAlbum(groupIndex, albumIndex, { subtitle })
                              }
                            />
                            <Field
                              label="Location"
                              value={album.location ?? ''}
                              onChange={location =>
                                updateAlbum(groupIndex, albumIndex, { location })
                              }
                            />
                            <Field
                              label="Date label"
                              value={album.dates}
                              onChange={dates => updateAlbum(groupIndex, albumIndex, { dates })}
                            />
                            <Field
                              label="Year"
                              type="number"
                              min={2000}
                              max={2100}
                              value={Number.isFinite(album.year) ? album.year : ''}
                              onChange={year =>
                                updateAlbum(groupIndex, albumIndex, {
                                  year: Number.parseInt(year, 10),
                                })
                              }
                            />
                            <label>
                              <span className={labelClass}>Media</span>
                              <select
                                value={album.media}
                                onChange={event =>
                                  updateAlbum(groupIndex, albumIndex, {
                                    media: event.target.value as AlbumMedia,
                                  })
                                }
                                className={inputClass}
                              >
                                <option value="photos">Photos</option>
                                <option value="videos">Videos</option>
                              </select>
                            </label>
                            <Field
                              label="Google Photos URL"
                              type="url"
                              value={album.url ?? ''}
                              onChange={url => updateAlbum(groupIndex, albumIndex, { url })}
                            />
                            <label className="md:col-span-2">
                              <span className={labelClass}>Pending message</span>
                              <textarea
                                value={album.pendingNote ?? ''}
                                onChange={event =>
                                  updateAlbum(groupIndex, albumIndex, {
                                    pendingNote: event.target.value,
                                  })
                                }
                                rows={2}
                                className={inputClass}
                              />
                            </label>
                            <div className="md:col-span-2">
                              {renderCoverUploader ? (
                                renderCoverUploader(album, coverImage =>
                                  updateAlbum(groupIndex, albumIndex, { coverImage }),
                                )
                              ) : (
                                <Field
                                  label="Cover image URL"
                                  type="url"
                                  value={album.coverImage ?? ''}
                                  onChange={coverImage =>
                                    updateAlbum(groupIndex, albumIndex, { coverImage })
                                  }
                                />
                              )}
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-plum">
                              <input
                                type="checkbox"
                                checked={album.published !== false}
                                onChange={event =>
                                  updateAlbum(groupIndex, albumIndex, {
                                    published: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 accent-plum"
                              />
                              Published
                            </label>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addAlbum(groupIndex)}
                        className="inline-flex items-center gap-2 rounded-full border border-plum/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-plum transition hover:bg-plum/5"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add album
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
