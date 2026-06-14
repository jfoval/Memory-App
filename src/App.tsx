import { PALACE } from './palace/palaceData';

// Placeholder shell — replaced as features land. Confirms the toolchain builds.
export default function App() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Memory Palace</h1>
      <p className="text-slate-500">
        A shared {PALACE.length}-location palace for the Method of Loci.
      </p>
    </div>
  );
}
