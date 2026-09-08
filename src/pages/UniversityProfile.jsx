import { useState } from 'react';
import {
  Building2, Eye, Globe, GraduationCap, Image, MapPin, Plus, Save, Star, Trash2, Trophy, Users, X, Check,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { currency, number } from '../lib/format';
import PageHeader from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { TextField, TextArea } from '../components/ui/Field';

const PHOTO_TONES = {
  brand: 'from-brand-800 to-brand-950',
  royal: 'from-royal-500 to-royal-800',
  accent: 'from-accent-500 to-accent-800',
  emerald: 'from-emerald-500 to-emerald-800',
};

/**
 * Campus photography is a placeholder in this build — a labelled gradient tile
 * rather than a fake stock image, so it is obvious a real asset is needed here.
 */
function PhotoTile({ photo, className = '', onRemove }) {
  return (
    <div className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${PHOTO_TONES[photo.tone] ?? PHOTO_TONES.brand} ${className}`}>
      <div className="absolute inset-0 grid place-items-center">
        <Image className="h-5 w-5 text-white/25" aria-hidden />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2.5 py-2">
        <p className="text-2xs font-bold text-white/95">{photo.label}</p>
        <p className="text-[0.625rem] text-white/75">Photo placeholder</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${photo.label}`}
          className="absolute top-1.5 right-1.5 h-6 w-6 grid place-items-center rounded-md bg-black/45
            text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-rose-600 transition-all"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function UniversityProfile() {
  const { state, dispatch, toast } = useStore();
  const uni = state.university;
  const [tab, setTab] = useState('edit');
  const [newBullet, setNewBullet] = useState('');
  const [newPhoto, setNewPhoto] = useState('');

  const patch = (p) => dispatch({ type: 'UPDATE_UNIVERSITY', patch: p });

  return (
    <div className="space-y-4">
      <PageHeader
        title="University profile"
        description="What prospective students see when they find you on StudyFound."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              {uni.location.city}, {uni.location.state}, {uni.location.country}
            </span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <Trophy className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              #{uni.ranking.world} worldwide · #{uni.ranking.national} in {uni.location.country}
            </span>
          </>
        }
      />

      <Card>
        <Tabs
          className="px-2"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'edit', label: 'Edit listing', icon: Building2 },
            { id: 'preview', label: 'Student preview', icon: Eye },
          ]}
        />

        {tab === 'edit' && (
          <CardBody>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5 max-w-5xl">
              <div className="space-y-4">
                <h3 className="text-13 font-bold text-slate-900">Identity</h3>
                <TextField label="University name" value={uni.name} onChange={(e) => patch({ name: e.target.value })} />
                <TextField
                  label="Logo mark"
                  hint="Two or three letters used wherever the full logo does not fit."
                  maxLength={3}
                  value={uni.logoText}
                  onChange={(e) => patch({ logoText: e.target.value.toUpperCase() })}
                  inputClassName="uppercase font-display"
                />
                <TextField
                  label="Tagline"
                  hint="One line, shown directly under the name in search results."
                  value={uni.tagline}
                  onChange={(e) => patch({ tagline: e.target.value })}
                />
                <TextArea
                  label="Description"
                  hint="The main body of your public listing."
                  rows={8}
                  maxLength={1600}
                  value={uni.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-13 font-bold text-slate-900">Location &amp; standing</h3>
                <div className="grid grid-cols-3 gap-3">
                  <TextField label="City" value={uni.location.city} onChange={(e) => patch({ location: { ...uni.location, city: e.target.value } })} />
                  <TextField label="State" value={uni.location.state} onChange={(e) => patch({ location: { ...uni.location, state: e.target.value } })} />
                  <TextField label="Country" value={uni.location.country} onChange={(e) => patch({ location: { ...uni.location, country: e.target.value } })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="World ranking"
                    type="number"
                    min={1}
                    value={uni.ranking.world}
                    onChange={(e) => patch({ ranking: { ...uni.ranking, world: Number(e.target.value) || 1 } })}
                    inputClassName="tabular"
                  />
                  <TextField
                    label="National ranking"
                    type="number"
                    min={1}
                    value={uni.ranking.national}
                    onChange={(e) => patch({ ranking: { ...uni.ranking, national: Number(e.target.value) || 1 } })}
                    inputClassName="tabular"
                  />
                </div>
                <TextField
                  label="Ranking source"
                  value={uni.ranking.source}
                  onChange={(e) => patch({ ranking: { ...uni.ranking, source: e.target.value } })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Tuition from (AUD)"
                    type="number"
                    step={500}
                    value={uni.tuitionRange.min}
                    onChange={(e) => patch({ tuitionRange: { ...uni.tuitionRange, min: Number(e.target.value) || 0 } })}
                    inputClassName="tabular"
                  />
                  <TextField
                    label="Tuition to (AUD)"
                    type="number"
                    step={500}
                    value={uni.tuitionRange.max}
                    onChange={(e) => patch({ tuitionRange: { ...uni.tuitionRange, max: Number(e.target.value) || 0 } })}
                    inputClassName="tabular"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Total students"
                    type="number"
                    value={uni.studentCount}
                    onChange={(e) => patch({ studentCount: Number(e.target.value) || 0 })}
                    inputClassName="tabular"
                  />
                  <TextField
                    label="International students"
                    type="number"
                    value={uni.intlStudentCount}
                    onChange={(e) => patch({ intlStudentCount: Number(e.target.value) || 0 })}
                    inputClassName="tabular"
                  />
                </div>
                <TextField label="Website" value={uni.website} onChange={(e) => patch({ website: e.target.value })} />
                <TextField label="Admissions contact" type="email" value={uni.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} />
              </div>

              {/* Why study here */}
              <div className="lg:col-span-2 pt-2 border-t border-slate-200">
                <h3 className="text-13 font-bold text-slate-900 mt-4 mb-1">Why study here</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Short, specific, verifiable claims. Vague statements reduce conversion more than they help.
                </p>
                {uni.whyStudyHere.length === 0 ? (
                  <p className="text-13 text-slate-500 mb-3">No bullets yet — add at least three.</p>
                ) : (
                  <ul className="space-y-1.5 mb-3">
                    {uni.whyStudyHere.map((b, i) => (
                      <li key={`${b}-${i}`} className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                        <input
                          value={b}
                          aria-label={`Why study here point ${i + 1}`}
                          onChange={(e) => {
                            const next = [...uni.whyStudyHere];
                            next[i] = e.target.value;
                            patch({ whyStudyHere: next });
                          }}
                          className="flex-1 bg-transparent text-13 text-slate-700 outline-none focus:text-slate-900"
                        />
                        <button
                          type="button"
                          aria-label={`Remove point ${i + 1}`}
                          onClick={() => patch({ whyStudyHere: uni.whyStudyHere.filter((_, x) => x !== i) })}
                          className="shrink-0 h-6 w-6 grid place-items-center rounded text-slate-300
                            opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 max-w-xl">
                  <input
                    value={newBullet}
                    onChange={(e) => setNewBullet(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newBullet.trim()) {
                        patch({ whyStudyHere: [...uni.whyStudyHere, newBullet.trim()] });
                        setNewBullet('');
                      }
                    }}
                    placeholder="e.g. 92% graduate employment within six months"
                    aria-label="New why-study-here point"
                    className="input"
                  />
                  <Button
                    variant="secondary"
                    icon={Plus}
                    disabled={!newBullet.trim()}
                    onClick={() => {
                      patch({ whyStudyHere: [...uni.whyStudyHere, newBullet.trim()] });
                      setNewBullet('');
                      toast('Point added to your listing');
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Campus photos */}
              <div className="lg:col-span-2 pt-2 border-t border-slate-200">
                <h3 className="text-13 font-bold text-slate-900 mt-4 mb-1">Campus photos</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Image upload is not wired up in this build — tiles are labelled placeholders standing in for real photography.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                  {uni.campusPhotos.map((p) => (
                    <PhotoTile
                      key={p.id}
                      photo={p}
                      className="aspect-[4/3]"
                      onRemove={() => patch({ campusPhotos: uni.campusPhotos.filter((x) => x.id !== p.id) })}
                    />
                  ))}
                </div>
                <div className="flex gap-2 max-w-xl">
                  <input
                    value={newPhoto}
                    onChange={(e) => setNewPhoto(e.target.value)}
                    placeholder="Caption for a new photo slot, e.g. Student Union"
                    aria-label="New photo caption"
                    className="input"
                  />
                  <Button
                    variant="secondary"
                    icon={Plus}
                    disabled={!newPhoto.trim()}
                    onClick={() => {
                      patch({
                        campusPhotos: [
                          ...uni.campusPhotos,
                          {
                            id: `ph_${Date.now()}`,
                            label: newPhoto.trim(),
                            tone: ['brand', 'royal', 'accent', 'emerald'][uni.campusPhotos.length % 4],
                          },
                        ],
                      });
                      setNewPhoto('');
                    }}
                  >
                    Add slot
                  </Button>
                </div>
              </div>
            </div>

            <p className="mt-5 flex items-center gap-1.5 text-2xs text-slate-600">
              <Save className="h-3 w-3" aria-hidden />
              Changes save as you type and are reflected in the student preview immediately.
            </p>
          </CardBody>
        )}

        {tab === 'preview' && <StudentPreview uni={uni} courses={state.courses} />}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
function StudentPreview({ uni, courses }) {
  const active = courses.filter((c) => c.active);
  return (
    <CardBody className="bg-slate-100/70">
      <div className="mb-3 flex items-center gap-2">
        <Badge tone="sky" icon={Eye}>Student view</Badge>
        <p className="text-xs text-slate-600">Exactly how your listing renders on StudyFound.</p>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        {/* Cover */}
        <div className="relative h-36 bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950">
          <div className="absolute inset-0 grid place-items-center">
            <Image className="h-6 w-6 text-white/15" aria-hidden />
          </div>
          <p className="absolute bottom-2 right-3 text-[0.625rem] text-white/60">Cover photo placeholder</p>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end gap-3 -mt-8 mb-4">
            <span className="grid place-items-center h-16 w-16 shrink-0 rounded-xl bg-white ring-4 ring-white shadow-card
              font-display text-xl text-brand-900" aria-hidden>
              {uni.logoText}
            </span>
            <div className="pb-1 min-w-0">
              <h2 className="font-display text-2xl text-brand-950 leading-none truncate">{uni.name}</h2>
              <p className="mt-1.5 text-13 text-slate-600 truncate">{uni.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge tone="brand" icon={Trophy}>#{uni.ranking.world} worldwide</Badge>
            <Badge tone="accent" icon={Star}>#{uni.ranking.national} in {uni.location.country}</Badge>
            <Badge tone="slate" icon={MapPin}>{uni.location.city}, {uni.location.state}</Badge>
            <Badge tone="slate" icon={Globe}>{uni.website}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            {[
              ['Students', number(uni.studentCount), Users],
              ['International', number(uni.intlStudentCount), Globe],
              ['Courses listed', number(active.length), GraduationCap],
              ['Established', uni.established, Building2],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-2.5">
                <p className="flex items-center gap-1 micro-label">
                  <Icon className="h-3 w-3 text-slate-500" aria-hidden />
                  {label}
                </p>
                <p className="font-display text-xl text-brand-950 leading-none mt-1.5 tabular">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-royal-50 border border-royal-200 px-3.5 py-3 mb-5">
            <p className="micro-label text-royal-700">Annual tuition</p>
            <p className="font-display text-2xl text-brand-950 leading-none mt-1.5 tabular">
              {currency(uni.tuitionRange.min, uni.tuitionRange.currency)} – {currency(uni.tuitionRange.max, uni.tuitionRange.currency)}
            </p>
            <p className="text-2xs text-slate-600 mt-1.5">Varies by course. International student rate.</p>
          </div>

          <section className="mb-5">
            <h3 className="text-13 font-bold text-slate-900 mb-2">About</h3>
            <p className="text-13 leading-[1.75] text-slate-700 text-pretty">{uni.description}</p>
          </section>

          {uni.whyStudyHere.length > 0 && (
            <section className="mb-5">
              <h3 className="text-13 font-bold text-slate-900 mb-2">Why study here</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {uni.whyStudyHere.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-13 text-slate-700">
                    <Check className="h-3.5 w-3.5 shrink-0 mt-1 text-emerald-600" aria-hidden />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {uni.campusPhotos.length > 0 && (
            <section className="mb-5">
              <h3 className="text-13 font-bold text-slate-900 mb-2">Campus</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {uni.campusPhotos.map((p) => (
                  <PhotoTile key={p.id} photo={p} className="aspect-[4/3]" />
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-13 font-bold text-slate-900 mb-2">
              Courses <span className="font-normal text-slate-500">({active.length})</span>
            </h3>
            {active.length === 0 ? (
              <EmptyState
                compact
                icon={GraduationCap}
                title="No courses listed publicly"
                description="Students will see an empty listing until at least one course is set to active."
              />
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {active.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="grid place-items-center h-8 w-8 shrink-0 rounded-lg bg-slate-100 text-slate-600 text-2xs font-bold" aria-hidden>
                      {c.level[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-13 font-semibold text-slate-800 truncate">{c.title}</span>
                      <span className="block text-2xs text-slate-600">{c.faculty} · {c.duration}</span>
                    </span>
                    <span className="text-13 font-semibold text-slate-700 tabular shrink-0">
                      {currency(c.tuition, c.currency)}<span className="text-slate-500">/yr</span>
                    </span>
                  </li>
                ))}
                {active.length > 6 && (
                  <li className="px-3 py-2 text-2xs text-slate-600">…and {active.length - 6} more courses</li>
                )}
              </ul>
            )}
          </section>

          {uni.accreditation?.length > 0 && (
            <section className="mt-5 pt-4 border-t border-slate-200">
              <p className="micro-label mb-2">Accreditation</p>
              <div className="flex flex-wrap gap-1.5">
                {uni.accreditation.map((a) => (
                  <Badge key={a} tone="slate" size="sm">{a}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </CardBody>
  );
}
