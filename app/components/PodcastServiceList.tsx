'use client';

import { PodcastService } from '@/app/types/podcast';

interface PodcastServiceListProps {
    services: PodcastService[];
    onEdit: (service: PodcastService) => void;
    onDelete: (serviceId: string) => void;
}

export default function PodcastServiceList({ services, onEdit, onDelete }: PodcastServiceListProps) {
    if (services.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No services listed yet.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
                <div key={service.id} className="bg-white border rounded-lg shadow-sm p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{service.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${service.price === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {service.price === 0 ? 'Free' : `$${service.price}`}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                        <div className="flex gap-2 text-xs text-gray-500 mb-4">
                            <span className="bg-gray-100 px-2 py-1 rounded">{service.duration}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded capitalize">{service.type.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                            onClick={() => onEdit(service)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this service?')) {
                                    onDelete(service.id);
                                }
                            }}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
