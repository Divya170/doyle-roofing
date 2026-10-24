import { redirect } from 'next/navigation';

/** The admin opens on the estimate requests list. */
export default function AdminHome() {
  redirect('/admin/estimates');
}
