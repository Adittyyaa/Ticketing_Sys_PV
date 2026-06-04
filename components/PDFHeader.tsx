import Image from 'next/image'
import { format } from 'date-fns'
import { Ticket } from '@/lib/types'

interface PDFHeaderProps {
  ticket: Ticket
}

export default function PDFHeader({ ticket }: PDFHeaderProps) {
  return (
    <div className="hidden print:block mb-8">
      <div className="flex items-center justify-between mb-6 border-b-2 border-slate-700 pb-4">
        <div className="flex items-center gap-4">
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={60} 
            height={60} 
            className="rounded-lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">Ticket Report</h1>
            <p className="text-slate-400 text-sm">Generated on {format(new Date(), 'PPP p')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-slate-400 text-sm">Ticket Number</p>
          <p className="text-white font-semibold">#{ticket.number}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Status</p>
          <p className="text-white font-semibold">{ticket.status}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Priority</p>
          <p className="text-white font-semibold">{ticket.priority}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Category</p>
          <p className="text-white font-semibold">{ticket.category}</p>
        </div>
      </div>
    </div>
  )
}
