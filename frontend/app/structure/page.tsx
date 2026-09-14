import { getOrgPositions, getGovernorates } from '@/lib/publicApi';
import { POSITION_ROLE_LABELS, COMMITTEES, type PositionRoleValue } from '@/lib/constants';
import type { OrgPosition } from '@/lib/types';
import UserAvatar from '@/components/UserAvatar';
import { UsersIcon, PinIcon, StarIcon } from '@/components/icons';

export const metadata = { title: 'الهيكل الإداري — رُوَّاد المحافظات الحدودية' };

function roleLabel(role: string): string {
  return POSITION_ROLE_LABELS[role as PositionRoleValue] ?? role;
}

function PersonCard({ person, detail }: { person: OrgPosition; detail?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-white p-4">
      <UserAvatar src={person.photo_url} name={person.name} size="md" />
      <div className="min-w-0">
        <p className="truncate font-bold">{person.name}</p>
        <p className="truncate text-xs text-rust">{detail || roleLabel(person.position_role)}</p>
      </div>
    </div>
  );
}

export default async function StructurePage() {
  const [positions, governorates] = await Promise.all([
    getOrgPositions().catch(() => []),
    getGovernorates().catch(() => []),
  ]);

  const leadership = positions
    .filter((p) => p.position_role === 'president' || p.position_role === 'vice_president')
    .sort((a, b) => (a.position_role === 'president' ? -1 : 1));

  const governorateSections = governorates
    .map((g) => {
      const govPositions = positions.filter((p) => p.position_governorate === g.name);
      const coordinator = govPositions.find((p) => p.position_role === 'governorate_coordinator');
      const committees = COMMITTEES.map((committee) => ({
        name: committee,
        head: govPositions.find((p) => p.position_committee === committee && p.position_role === 'committee_head'),
        deputy: govPositions.find((p) => p.position_committee === committee && p.position_role === 'committee_deputy'),
        members: govPositions.filter((p) => p.position_committee === committee && p.position_role === 'committee_member'),
      })).filter((c) => c.head || c.deputy || c.members.length > 0);
      return { governorate: g, coordinator, committees };
    })
    .filter((entry) => entry.coordinator || entry.committees.length > 0);

  const isEmpty = leadership.length === 0 && governorateSections.length === 0;

  return (
    <>
      <section className="bg-night pb-10 pt-16 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <span className="h-0.5 w-6 bg-gold-2" /> الهيكل الإداري
          </p>
          <h1 className="max-w-[24ch] font-display text-3xl sm:text-4xl">قيادة الكيان في كل محافظة ولجنة</h1>
          <p className="mt-4 max-w-[60ch] opacity-75">
            تعرّف على فريق القيادة على مستوى الكيان، ومنسقي المحافظات، ورؤساء ونواب اللجان في كل محافظة نعمل بها.
          </p>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          {isEmpty ? (
            <div className="rounded-2xl border border-gold/25 bg-white py-16 text-center">
              <UsersIcon className="mx-auto mb-3 h-9 w-9 text-rust/40" />
              <p className="text-ink/60">الهيكل الإداري لسه في مرحلة التجهيز — تابعونا قريبًا.</p>
            </div>
          ) : (
            <>
              {leadership.length > 0 && (
                <div className="mb-14">
                  <h2 className="mb-6 flex items-center gap-2 font-display text-2xl">
                    <StarIcon className="h-5 w-5 text-gold" /> قيادة الكيان
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:max-w-[640px]">
                    {leadership.map((p) => (
                      <PersonCard key={p.id} person={p} />
                    ))}
                  </div>
                </div>
              )}

              {governorateSections.length > 0 && (
                <div>
                  <h2 className="mb-6 flex items-center gap-2 font-display text-2xl">
                    <PinIcon className="h-5 w-5 text-rust" /> فرق المحافظات
                  </h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {governorateSections.map(({ governorate, coordinator, committees }) => (
                      <div key={governorate.id} className="rounded-[20px] border border-gold/25 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between gap-2 border-b border-gold/15 pb-4">
                          <h3 className="font-display text-lg">{governorate.name}</h3>
                          <a href={`/governorates/${governorate.slug}`} className="text-xs font-bold text-violet-700 hover:underline">
                            صفحة المحافظة
                          </a>
                        </div>

                        {coordinator && (
                          <div className="mb-4">
                            <PersonCard person={coordinator} />
                          </div>
                        )}

                        {committees.length > 0 && (
                          <div className="grid gap-3">
                            {committees.map((c) => (
                              <div key={c.name} className="rounded-xl bg-sand/50 p-3">
                                <p className="mb-2 font-utility text-xs font-bold text-ink/60">لجنة {c.name}</p>
                                <div className="grid gap-2">
                                  {c.head && <PersonCard person={c.head} detail={`رئيس لجنة ${c.name}`} />}
                                  {c.deputy && <PersonCard person={c.deputy} detail={`نائب لجنة ${c.name}`} />}
                                  {c.members.map((m) => (
                                    <PersonCard key={m.id} person={m} detail={`عضو لجنة ${c.name}`} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
