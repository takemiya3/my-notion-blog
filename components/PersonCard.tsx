import Image from 'next/image';
import Link from 'next/link';
import { Person } from '@/lib/notion/people';

interface PersonCardProps {
  person: Person;
}

export default function PersonCard({ person }: PersonCardProps) {
  return (
    <Link 
      href={`/person/${person.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 
                 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {person.image ? (
          <Image
            src={person.image}
            alt={person.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform 
                       duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-4xl">👤</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 
                       transition-colors">
          {person.name}
        </h3>
        {person.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {person.description}
          </p>
        )}
        {person.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {person.categories.slice(0, 3).map((cat, idx) => (
              <span 
                key={idx}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}